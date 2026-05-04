import { Router } from "express";
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import {
  createEventReview,
  getEventReviews,
  getEventReviewStatus,
  voteOnEventReview,
} from "../controllers/eventReviewController.js";
import {
  validateCreateEvent,
  validateCreateEventReview,
  validateReviewVote,
  validateUpdateEvent,
  validateObjectId,
} from "../utils/validators.js";
import { authorize, optionalAuth, protect } from "../middlewares/authMiddleware.js";
import { uploadImage } from "../config/multerConfig.js";

const router = Router();

// ======= Get all events (public) =======
router.get("/", getEvents);

// ======= Event reviews (must be before GET /:id) =======
router.get("/:id/reviews", optionalAuth, getEventReviews);
router.get("/:id/review-status", optionalAuth, getEventReviewStatus);
router.post(
  "/:id/reviews",
  protect,
  validateCreateEventReview,
  createEventReview,
);
router.post(
  "/:id/reviews/:reviewId/vote",
  protect,
  ...validateObjectId("id"),
  ...validateObjectId("reviewId"),
  validateReviewVote,
  voteOnEventReview,
);

// ======= Get single event (public) =======
router.get("/:id", getEvent);

// ======= Create new event (admin only) =======
router.post(
  "/",
  protect,
  authorize(["admin"]),
  uploadImage.single("image"),
  validateCreateEvent,
  createEvent,
);

// ======= Update event (admin only) =======
router.put(
  "/:id",
  protect,
  authorize(["admin"]),
  uploadImage.single("image"),
  validateUpdateEvent,
  updateEvent,
);

// ======= Delete event (admin only) =======
router.delete("/:id", protect, authorize(["admin"]), deleteEvent);

export default router;
