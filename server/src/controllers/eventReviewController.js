import mongoose from "mongoose";
import AppError from "../middlewares/AppError.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import EventReview from "../models/EventReview.js";
import EventReviewVote from "../models/EventReviewVote.js";

const userObjectId = (req) => {
  const raw = req.user?.id ?? req.user?._id;
  if (!raw) return null;
  return new mongoose.Types.ObjectId(raw);
};

/**
 * Eligible to review: at least one confirmed booking for this event
 * while the event is not cancelled.
 */
export const getReviewEligibility = async (userId, event) => {
  if (!userId || !event?._id) {
    return { canReview: false, reason: "NOT_AUTHENTICATED" };
  }

  if (event.status === "cancelled") {
    return { canReview: false, reason: "EVENT_CANCELLED" };
  }

  const booking = await Booking.findOne({
    userId,
    eventId: event._id,
    status: "confirmed",
  }).select("_id");

  if (!booking) {
    return { canReview: false, reason: "NO_CONFIRMED_BOOKING" };
  }

  return { canReview: true, reason: null };
};

async function buildReviewListPayload(reviews, uid) {
  const ids = reviews.map((r) => r._id);
  if (!ids.length) {
    return [];
  }

  const [agg, userVotes] = await Promise.all([
    EventReviewVote.aggregate([
      { $match: { reviewId: { $in: ids } } },
      {
        $group: {
          _id: "$reviewId",
          helpfulUp: { $sum: { $cond: [{ $eq: ["$value", "up"] }, 1, 0] } },
          helpfulDown: { $sum: { $cond: [{ $eq: ["$value", "down"] }, 1, 0] } },
        },
      },
    ]),
    uid
      ? EventReviewVote.find({ userId: uid, reviewId: { $in: ids } })
          .select("reviewId value")
          .lean()
      : [],
  ]);

  const countByReview = new Map();
  for (const row of agg) {
    countByReview.set(String(row._id), {
      helpfulUp: row.helpfulUp ?? 0,
      helpfulDown: row.helpfulDown ?? 0,
    });
  }

  const userVoteByReview = new Map();
  for (const v of userVotes) {
    userVoteByReview.set(String(v.reviewId), v.value);
  }

  return reviews.map((r) => {
    const idStr = String(r._id);
    const c = countByReview.get(idStr) ?? { helpfulUp: 0, helpfulDown: 0 };
    const u = r.userId;
    const name =
      u && typeof u === "object" && u.name ? u.name : "Attendee";
    const pictureUrl =
      u && typeof u === "object" && typeof u.pictureUrl === "string"
        ? u.pictureUrl.trim()
        : "";
    return {
      _id: r._id,
      authorId: u && typeof u === "object" && u._id ? String(u._id) : undefined,
      rating: r.rating,
      message: r.message,
      createdAt: r.createdAt,
      authorName: name,
      authorPictureUrl: pictureUrl,
      helpfulUp: c.helpfulUp,
      helpfulDown: c.helpfulDown,
      userVote: uid ? (userVoteByReview.get(idStr) ?? null) : null,
    };
  });
}

function buildReviewSummaryPayload(reviews) {
  const totalReviews = reviews.length;
  const countsByRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  for (const r of reviews) {
    const rating = Number(r.rating);
    if (rating >= 1 && rating <= 5) {
      countsByRating[rating] += 1;
      totalRating += rating;
    }
  }

  const averageRating = totalReviews ? Math.round((totalRating / totalReviews) * 10) / 10 : 0;
  const distribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = countsByRating[rating] ?? 0;
    const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
    return { level: rating, count, pct };
  });

  return {
    averageRating,
    totalReviews,
    distribution,
  };
}

export const getEventReviews = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw AppError.badRequest("Invalid event id.");
    }

    const event = await Event.findById(eventId).select("_id");
    if (!event) throw AppError.notFound("Event not found.");

    const reviews = await EventReview.find({ eventId })
      .populate("userId", "name pictureUrl")
      .sort({ createdAt: -1 })
      .lean();

    const uid = userObjectId(req);
    const list = await buildReviewListPayload(reviews, uid);
    const summary = buildReviewSummaryPayload(reviews);

    res.status(200).json({
      success: true,
      message: "Reviews retrieved successfully.",
      data: { reviews: list, totalReviews: list.length, summary },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when retrieving reviews."));
  }
};

export const getEventReviewStatus = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw AppError.badRequest("Invalid event id.");
    }

    const event = await Event.findById(eventId);
    if (!event) throw AppError.notFound("Event not found.");

    const uid = userObjectId(req);
    if (!uid) {
      return res.status(200).json({
        success: true,
        data: {
          authenticated: false,
          canReview: false,
          hasReviewed: false,
          reason: "NOT_AUTHENTICATED",
        },
      });
    }

    const existing = await EventReview.findOne({
      userId: uid,
      eventId: event._id,
    }).select("_id rating message createdAt");

    const eligibility = await getReviewEligibility(uid, event);

    res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        canReview: eligibility.canReview && !existing,
        hasReviewed: !!existing,
        reason: existing ? "ALREADY_REVIEWED" : eligibility.reason,
        existingReview: existing
          ? {
              _id: existing._id,
              rating: existing.rating,
              message: existing.message,
              createdAt: existing.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when checking review status."));
  }
};

export const createEventReview = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const { rating, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw AppError.badRequest("Invalid event id.");
    }

    const uid = userObjectId(req);
    if (!uid) throw AppError.unauthorized("You must be logged in to leave a review.");

    const event = await Event.findById(eventId);
    if (!event) throw AppError.notFound("Event not found.");

    const existing = await EventReview.findOne({
      userId: uid,
      eventId: event._id,
    });
    if (existing) {
      throw AppError.badRequest("You have already reviewed this event.");
    }

    const eligibility = await getReviewEligibility(uid, event);
    if (!eligibility.canReview) {
      throw AppError.forbidden(
        "Reviews are only available for users with a confirmed booking.",
      );
    }

    const review = await EventReview.create({
      userId: uid,
      eventId: event._id,
      rating: Number(rating),
      message: typeof message === "string" ? message.trim() : "",
    });

    await review.populate("userId", "name pictureUrl");

    const u = review.userId;
    const name = u && typeof u === "object" && u.name ? u.name : "You";
    const pictureUrl =
      u && typeof u === "object" && typeof u.pictureUrl === "string"
        ? u.pictureUrl.trim()
        : "";

    res.status(201).json({
      success: true,
      message: "Thank you for your review.",
      data: {
        _id: review._id,
        authorId: String(uid),
        rating: review.rating,
        message: review.message,
        createdAt: review.createdAt,
        authorName: name,
        authorPictureUrl: pictureUrl,
        helpfulUp: 0,
        helpfulDown: 0,
        userVote: null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    if (error?.code === 11000) {
      return next(AppError.badRequest("You have already reviewed this event."));
    }
    next(AppError.internalError("An error occurred when submitting your review."));
  }
};

export const updateEventReview = async (req, res, next) => {
  try {
    const { id: eventId, reviewId } = req.params;
    const { rating, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw AppError.badRequest("Invalid event id.");
    }
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw AppError.badRequest("Invalid review id.");
    }

    const uid = userObjectId(req);
    if (!uid) throw AppError.unauthorized("You must be logged in to edit your review.");

    const review = await EventReview.findOne({
      _id: reviewId,
      eventId,
    }).populate("userId", "name pictureUrl");
    if (!review) throw AppError.notFound("Review not found.");
    if (String(review.userId?._id ?? review.userId) !== String(uid)) {
      throw AppError.forbidden("You can edit only your own review.");
    }

    if (rating != null) {
      review.rating = Number(rating);
    }
    if (typeof message === "string") {
      review.message = message.trim();
    }
    await review.save();

    const [helpfulUp, helpfulDown, current] = await Promise.all([
      EventReviewVote.countDocuments({ reviewId: review._id, value: "up" }),
      EventReviewVote.countDocuments({ reviewId: review._id, value: "down" }),
      EventReviewVote.findOne({ reviewId: review._id, userId: uid }).select("value").lean(),
    ]);

    const u = review.userId;
    const name = u && typeof u === "object" && u.name ? u.name : "You";
    const pictureUrl =
      u && typeof u === "object" && typeof u.pictureUrl === "string"
        ? u.pictureUrl.trim()
        : "";

    res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      data: {
        _id: review._id,
        authorId: String(uid),
        rating: review.rating,
        message: review.message,
        createdAt: review.createdAt,
        authorName: name,
        authorPictureUrl: pictureUrl,
        helpfulUp,
        helpfulDown,
        userVote: current?.value ?? null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when updating your review."));
  }
};

export const deleteEventReview = async (req, res, next) => {
  try {
    const { id: eventId, reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw AppError.badRequest("Invalid event id.");
    }
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw AppError.badRequest("Invalid review id.");
    }

    const uid = userObjectId(req);
    if (!uid) throw AppError.unauthorized("You must be logged in to delete your review.");

    const review = await EventReview.findOne({ _id: reviewId, eventId }).select("_id userId");
    if (!review) throw AppError.notFound("Review not found.");
    if (String(review.userId) !== String(uid)) {
      throw AppError.forbidden("You can delete only your own review.");
    }

    await Promise.all([
      EventReviewVote.deleteMany({ reviewId: review._id }),
      review.deleteOne(),
    ]);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
      data: { reviewId: String(review._id) },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when deleting your review."));
  }
};

export const adminDeleteEventReview = async (req, res, next) => {
  try {
    const { id: eventId, reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw AppError.badRequest("Invalid event id.");
    }
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw AppError.badRequest("Invalid review id.");
    }

    const review = await EventReview.findOne({ _id: reviewId, eventId }).select("_id");
    if (!review) throw AppError.notFound("Review not found.");

    await Promise.all([
      EventReviewVote.deleteMany({ reviewId: review._id }),
      review.deleteOne(),
    ]);

    res.status(200).json({
      success: true,
      message: "Review deleted by admin successfully.",
      data: { reviewId: String(review._id) },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when deleting review as admin."));
  }
};

export const voteOnEventReview = async (req, res, next) => {
  try {
    const { id: eventId, reviewId } = req.params;
    const { value } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw AppError.badRequest("Invalid event id.");
    }
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw AppError.badRequest("Invalid review id.");
    }

    const uid = userObjectId(req);
    if (!uid) throw AppError.unauthorized("You must be logged in to vote.");

    const review = await EventReview.findOne({
      _id: reviewId,
      eventId,
    }).select("_id userId");
    if (!review) throw AppError.notFound("Review not found.");

    if (String(review.userId) === String(uid)) {
      throw AppError.forbidden("You cannot vote on your own review.");
    }

    const existing = await EventReviewVote.findOne({
      reviewId: review._id,
      userId: uid,
    });

    if (existing && existing.value === value) {
      await existing.deleteOne();
    } else if (existing) {
      existing.value = value;
      await existing.save();
    } else {
      await EventReviewVote.create({
        reviewId: review._id,
        userId: uid,
        value,
      });
    }

    const [helpfulUp, helpfulDown, current] = await Promise.all([
      EventReviewVote.countDocuments({ reviewId: review._id, value: "up" }),
      EventReviewVote.countDocuments({ reviewId: review._id, value: "down" }),
      EventReviewVote.findOne({ reviewId: review._id, userId: uid }).select("value").lean(),
    ]);

    res.status(200).json({
      success: true,
      message: "Vote updated.",
      data: {
        helpfulUp,
        helpfulDown,
        userVote: current?.value ?? null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when recording your vote."));
  }
};
