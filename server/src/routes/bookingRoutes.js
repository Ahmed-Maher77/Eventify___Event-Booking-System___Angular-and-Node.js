import { Router } from "express";
import {
  cancelBooking,
  createBooking,
  deleteCancelledBooking,
  getActiveBookingForEvent,
  getSingleBooking,
  getUsersBookings,
  updateBookingQuantity,
} from "../controllers/bookingController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  validateBooking,
  validateBookingQuantityUpdate,
  validateObjectId,
} from "../utils/validators.js";

const router = Router();

//         ==> GET <==
// ---- Get User's Bookings ----
router.get("/", protect, getUsersBookings);

// ---- Get User Active Booking For Event ----
router.get(
  "/events/:eventId/active",
  protect,
  ...validateObjectId("eventId"),
  getActiveBookingForEvent,
);

// ---- Get Single Booking ----
router.get("/:id", protect, ...validateObjectId(), getSingleBooking);

//         ==> POST <==
// ---- Create new Booking ----
router.post("/", protect, validateBooking, createBooking);

//              ==> PATCH <==
// ---- Update Booking Quantity [Owner/Admin] ----
router.patch(
  "/:id/quantity",
  protect,
  ...validateObjectId(),
  validateBookingQuantityUpdate,
  updateBookingQuantity,
);

// ---- Update Booking Quantity [Owner/Admin] ----
router.patch(
  "/:id/quantity",
  protect,
  ...validateObjectId(),
  validateBookingQuantityUpdate,
  updateBookingQuantity,
);

//      ==> DELETE <==
// ---- Cancel Booking ----
router.delete("/:id", protect, ...validateObjectId(), cancelBooking);
// ---- Delete Cancelled Booking Permanently ----
router.delete("/:id/remove", protect, ...validateObjectId(), deleteCancelledBooking);

export default router;
