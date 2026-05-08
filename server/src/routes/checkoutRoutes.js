import { Router } from "express";
import {
  createPaymentIntentForBooking,
  syncBookingPaymentFromStripe,
} from "../controllers/checkoutController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/payment-intent", protect, createPaymentIntentForBooking);
router.post("/sync-payment", protect, syncBookingPaymentFromStripe);

export default router;
