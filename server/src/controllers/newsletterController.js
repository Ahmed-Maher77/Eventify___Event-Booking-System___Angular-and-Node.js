import AppError from "../middlewares/AppError.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";

//        ==> POST <==
// ---- Subscribe to Newsletter ----
const createNewsletterSubscription = async (req, res, next) => {
  try {
    const { email } = req.body;

    const existingSubscriber = await NewsletterSubscriber.findOne({ email });
    if (existingSubscriber && existingSubscriber.status === "active") {
      throw AppError.conflict("This email is already subscribed.");
    }

    if (existingSubscriber && existingSubscriber.status === "unsubscribed") {
      existingSubscriber.status = "active";
      await existingSubscriber.save();

      return res.status(200).json({
        success: true,
        message: "You have been re-subscribed successfully.",
        data: existingSubscriber,
      });
    }

    const subscriber = await NewsletterSubscriber.create({ email });

    res.status(201).json({
      success: true,
      message: "Subscribed to newsletter successfully.",
      data: subscriber,
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(
      AppError.internalError(
        "An error occurred while subscribing to the newsletter.",
      ),
    );
  }
};

//        ==> GET <==
// ---- Get Newsletter Subscribers [Admin ONLY] ----
const getAllNewsletterSubscribers = async (req, res, next) => {
  try {
    const { status } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const subscribers = await NewsletterSubscriber.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalSubscribers = await NewsletterSubscriber.countDocuments(filter);
    const totalPages = Math.ceil(totalSubscribers / limit);

    res.status(200).json({
      success: true,
      message: "Newsletter subscribers retrieved successfully.",
      data: {
        subscribers,
        pagination: {
          currentPage: page,
          totalPages,
          totalSubscribers,
          limit,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(
      AppError.internalError(
        "An error occurred when retrieving newsletter subscribers.",
      ),
    );
  }
};

//              ==> PATCH <==
// ---- Update Newsletter Subscriber Status [Admin ONLY] ----
const updateNewsletterSubscriberStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const subscriber = await NewsletterSubscriber.findById(id);
    if (!subscriber) throw AppError.notFound("Newsletter subscriber not found.");

    subscriber.status = status;
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: "Newsletter subscriber status updated successfully.",
      data: subscriber,
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(
      AppError.internalError(
        "An error occurred when updating newsletter subscriber status.",
      ),
    );
  }
};

//              ==> DELETE <==
// ---- Delete Newsletter Subscriber [Admin ONLY] ----
const deleteNewsletterSubscriber = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscriber = await NewsletterSubscriber.findById(id);
    if (!subscriber) throw AppError.notFound("Newsletter subscriber not found.");

    await subscriber.deleteOne();

    res.status(200).json({
      success: true,
      message: "Newsletter subscriber deleted successfully.",
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(
      AppError.internalError(
        "An error occurred when deleting newsletter subscriber.",
      ),
    );
  }
};

export {
  createNewsletterSubscription,
  getAllNewsletterSubscribers,
  updateNewsletterSubscriberStatus,
  deleteNewsletterSubscriber,
};
