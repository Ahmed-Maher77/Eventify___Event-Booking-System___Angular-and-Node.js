import { Router } from "express";
import {
  cancelBooking,
  createBooking,
  getSingleBooking,
  getUsersBookings,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBooking, validateObjectId } from "../utils/validators.js";

const router = Router();

//         ==> GET <==
// ---- Get User's Bookings ----
router.get("/", protect, getUsersBookings);

// ---- Get Single Booking ----
router.get("/:id", protect, ...validateObjectId(), getSingleBooking);

//         ==> POST <==
// ---- Create new Booking ----
router.post("/", protect, validateBooking, createBooking);

//              ==> PATCH <==
// ---- Update Booking Status [Admin ONLY] ----
router.patch(
  "/:id",
  protect,
  ...validateObjectId(),
  authorize(["admin"]),
  updateBookingStatus,
);

//      ==> DELETE <==
// ---- Cancel Booking ----
router.delete("/:id", protect, ...validateObjectId(), cancelBooking);

export default router;
