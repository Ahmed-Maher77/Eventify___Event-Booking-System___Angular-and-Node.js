import { Router } from "express";
import { getAllBookings } from "../controllers/bookingController.js";
import {
  deleteContactMessage,
  getAllContactMessages,
  updateContactMessageStatus,
} from "../controllers/contactController.js";
import {
  deleteNewsletterSubscriber,
  getAllNewsletterSubscribers,
  updateNewsletterSubscriberStatus,
} from "../controllers/newsletterController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import {
  validateContactMessageStatusUpdate,
  validateNewsletterSubscriberStatusUpdate,
  validateObjectId,
} from "../utils/validators.js";

const router = Router();

router.use(protect, authorize(["admin"]));

//             ==> GET <==
// ---- Get All Bookings [Admin ONLY] ----
router.get("/bookings", getAllBookings);
router.get("/contact-messages", getAllContactMessages);
router.get("/newsletter-subscribers", getAllNewsletterSubscribers);

router.patch(
  "/contact-messages/:id/status",
  validateObjectId("id"),
  validateContactMessageStatusUpdate,
  updateContactMessageStatus,
);
router.delete("/contact-messages/:id", validateObjectId("id"), deleteContactMessage);

router.patch(
  "/newsletter-subscribers/:id/status",
  validateObjectId("id"),
  validateNewsletterSubscriberStatusUpdate,
  updateNewsletterSubscriberStatus,
);
router.delete(
  "/newsletter-subscribers/:id",
  validateObjectId("id"),
  deleteNewsletterSubscriber,
);

export default router;
