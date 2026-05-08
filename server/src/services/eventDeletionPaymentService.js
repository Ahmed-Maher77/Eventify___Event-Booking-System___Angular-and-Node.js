import { getStripe } from "../config/stripe.js";
import Booking from "../models/Booking.js";
import mongoose from "mongoose";

/**
 * When an event is deleted: cancel active bookings, cancel unpaid intents, refund paid bookings.
 */
export async function cancelBookingsForDeletedEvent(eventId) {
  const stripe = getStripe();
  const id =
    eventId instanceof mongoose.Types.ObjectId
      ? eventId
      : new mongoose.Types.ObjectId(String(eventId));

  const bookings = await Booking.find({
    eventId: id,
    status: { $in: ["pending", "confirmed"] },
  });

  for (const b of bookings) {
    if (b.payment?.paidAt && b.payment?.paymentIntentId && stripe) {
      await stripe.refunds
        .create({ payment_intent: b.payment.paymentIntentId })
        .catch(() => {});
      if (b.payment) {
        b.payment.refundStatus = "pending";
      }
    } else if (b.payment?.paymentIntentId && stripe && !b.payment?.paidAt) {
      await stripe.paymentIntents.cancel(b.payment.paymentIntentId).catch(() => {});
    }

    b.status = "cancelled";
    await b.save();
  }
}
