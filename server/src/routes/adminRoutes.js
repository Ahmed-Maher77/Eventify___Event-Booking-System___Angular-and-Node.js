import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createAdmin,
} from "../controllers/adminUserController.js";
import { getDashboardStats, getRecentBookings } from "../controllers/adminDashboardController.js";
import { getAllBookings } from "../controllers/bookingController.js";
import { getAllAssistantActivities } from "../controllers/adminAssistantActivityController.js";
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
  validateAdminUsersQuery,
  validateAdminCreation,
  validateObjectId,
} from "../utils/validators.js";

const router = Router();

router.use(protect, authorize(["admin"]));

//             ==> GET <==
// ---- Get All Bookings [Admin ONLY] ----
router.get("/dashboard-stats", getDashboardStats);
router.get("/bookings", getAllBookings);
router.get("/recent-bookings",getRecentBookings)
router.get("/users", validateAdminUsersQuery, getAllUsers);
router.get("/users/:id", validateObjectId("id"), getUserById);
router.get("/contact-messages", getAllContactMessages);
router.get("/newsletter-subscribers", getAllNewsletterSubscribers);
router.get("/assistant-activity", getAllAssistantActivities);

//             ==> POST <==
router.post("/users", validateAdminCreation, createAdmin);

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
