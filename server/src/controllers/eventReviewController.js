import mongoose from "mongoose";
import AppError from "../middlewares/AppError.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import EventReview from "../models/EventReview.js";

const userObjectId = (req) => {
  const raw = req.user?.id ?? req.user?._id;
  if (!raw) return null;
  return new mongoose.Types.ObjectId(raw);
};

/**
 * Eligible to review: at least one confirmed booking for this event
 * and the event start time is in the past.
 */
export const getReviewEligibility = async (userId, event) => {
  if (!userId || !event?._id) {
    return { canReview: false, reason: "NOT_AUTHENTICATED" };
  }

  if (event.status === "cancelled") {
    return { canReview: false, reason: "EVENT_CANCELLED" };
  }

  const eventStart = new Date(event.date);
  if (Number.isNaN(eventStart.getTime())) {
    return { canReview: false, reason: "INVALID_EVENT_DATE" };
  }
  if (eventStart >= new Date()) {
    return { canReview: false, reason: "EVENT_NOT_ENDED" };
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

export const getEventReviews = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw AppError.badRequest("Invalid event id.");
    }

    const event = await Event.findById(eventId).select("_id");
    if (!event) throw AppError.notFound("Event not found.");

    const reviews = await EventReview.find({ eventId })
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const list = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      message: r.message,
      createdAt: r.createdAt,
      authorName:
        r.userId && typeof r.userId === "object" && r.userId.name
          ? r.userId.name
          : "Attendee",
    }));

    res.status(200).json({
      success: true,
      message: "Reviews retrieved successfully.",
      data: { reviews: list, totalReviews: list.length },
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
        "Reviews are only available after a confirmed booking and once the event date has passed.",
      );
    }

    const review = await EventReview.create({
      userId: uid,
      eventId: event._id,
      rating: Number(rating),
      message: typeof message === "string" ? message.trim() : "",
    });

    await review.populate("userId", "name");

    res.status(201).json({
      success: true,
      message: "Thank you for your review.",
      data: {
        _id: review._id,
        rating: review.rating,
        message: review.message,
        createdAt: review.createdAt,
        authorName: review.userId?.name ?? "You",
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
