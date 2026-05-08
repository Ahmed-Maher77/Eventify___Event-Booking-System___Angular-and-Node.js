import mongoose from "mongoose";
import AppError from "../middlewares/AppError.js";
import { amountUsdToStripeCents, getStripe } from "../config/stripe.js";
import Booking from "../models/Booking.js";

const WEBHOOK_TOLERANCE_SEC = 300;

/**
 * POST /api/checkout/payment-intent — authenticated user pays for their pending booking.
 */
export const createPaymentIntentForBooking = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return next(
        AppError.internalError(
          "Online payments are not configured (missing STRIPE_SECRET_KEY).",
        ),
      );
    }

    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
    if (!publishableKey) {
      return next(
        AppError.internalError(
          "Online payments are not configured (missing STRIPE_PUBLISHABLE_KEY).",
        ),
      );
    }

    const { bookingId } = req.body || {};
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      throw AppError.badRequest("A valid booking ID is required.");
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) throw AppError.notFound("Booking not found.");

    if (booking.userId.toString() !== req.user.id.toString()) {
      throw AppError.forbidden("You do not have access to this booking.");
    }

    if (booking.status !== "pending") {
      throw AppError.badRequest("This booking does not require payment.");
    }

    const amountCents = amountUsdToStripeCents(booking.totalPrice);
    if (amountCents < 50) {
      throw AppError.badRequest(
        "Booking total is below the minimum charge amount.",
      );
    }

    if (booking.payment?.paidAt) {
      throw AppError.badRequest("This booking is already paid.");
    }

    if (booking.payment?.paymentIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(
          booking.payment.paymentIntentId,
        );
        if (
          existing.status === "requires_payment_method" ||
          existing.status === "requires_confirmation" ||
          existing.status === "requires_action"
        ) {
          if (existing.amount === amountCents && existing.currency === "usd") {
            return res.status(200).json({
              success: true,
              message: "Payment intent ready.",
              data: {
                clientSecret: existing.client_secret,
                publishableKey,
                bookingId: booking._id.toString(),
              },
            });
          }
        }
        await stripe.paymentIntents
          .cancel(booking.payment.paymentIntentId)
          .catch(() => {});
      } catch {
        /* create a fresh intent below */
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user.id.toString(),
      },
    });

    booking.payment = {
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      amountPaid: null,
      currency: paymentIntent.currency,
      paidAt: null,
      refundId: booking.payment?.refundId ?? null,
      refundStatus: booking.payment?.refundStatus ?? null,
    };
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Payment intent created.",
      data: {
        clientSecret: paymentIntent.client_secret,
        publishableKey,
        bookingId: booking._id.toString(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError(error?.message || "Could not create payment intent."));
  }
};

async function finalizePaidBookingFromIntent(paymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;
  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return;
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) return;

  const stripe = getStripe();
  if (booking.status === "cancelled") {
    if (stripe) {
      await stripe.refunds.create({ payment_intent: paymentIntent.id }).catch(() => {});
    }
    return;
  }

  if (booking.status === "confirmed" && booking.payment?.paidAt) {
    return;
  }

  booking.status = "confirmed";
  booking.payment = {
    paymentIntentId: paymentIntent.id,
    paymentStatus: paymentIntent.status,
    amountPaid: paymentIntent.amount_received ?? paymentIntent.amount,
    currency: paymentIntent.currency,
    paidAt: new Date(),
    refundId: booking.payment?.refundId ?? null,
    refundStatus: booking.payment?.refundStatus ?? null,
  };
  await booking.save();
}

/**
 * POST /api/checkout/sync-payment — after redirect from Stripe, verify PaymentIntent and confirm booking.
 * Webhooks may be delayed or unreachable locally; this uses the Stripe API with the booking's intent id.
 */
export const syncBookingPaymentFromStripe = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return next(
        AppError.internalError(
          "Online payments are not configured (missing STRIPE_SECRET_KEY).",
        ),
      );
    }

    const { bookingId } = req.body || {};
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      throw AppError.badRequest("A valid booking ID is required.");
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) throw AppError.notFound("Booking not found.");

    if (booking.userId.toString() !== req.user.id.toString()) {
      throw AppError.forbidden("You do not have access to this booking.");
    }

    if (booking.status === "confirmed" && booking.payment?.paidAt) {
      return res.status(200).json({
        success: true,
        message: "Booking already confirmed.",
        data: { status: booking.status },
      });
    }

    const piId = booking.payment?.paymentIntentId;
    if (!piId) {
      throw AppError.badRequest("No payment was started for this booking.");
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(piId);

    if (paymentIntent.status === "succeeded") {
      await finalizePaidBookingFromIntent(paymentIntent);
      const updated = await Booking.findById(bookingId);
      return res.status(200).json({
        success: true,
        message: "Payment verified.",
        data: {
          status: updated?.status ?? "confirmed",
          paymentIntentStatus: paymentIntent.status,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment not completed yet.",
      data: {
        status: booking.status,
        paymentIntentStatus: paymentIntent.status,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError(error?.message || "Could not sync payment status."));
  }
};

/**
 * Raw body POST /api/checkout/webhook
 */
export const handleStripeWebhook = async (req, res, next) => {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !whSecret) {
    res.status(503).send("Stripe webhook is not configured.");
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).send("Missing stripe-signature header.");
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      whSecret,
      WEBHOOK_TOLERANCE_SEC,
    );
  } catch (err) {
    res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        await finalizePaidBookingFromIntent(pi);
        break;
      }
      case "payment_intent.payment_failed": {
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (piId) {
          const booking = await Booking.findOne({
            "payment.paymentIntentId": piId,
          });
          if (booking?.payment) {
            booking.payment.refundStatus = "succeeded";
            await booking.save().catch(() => {});
          }
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (e) {
    next(e);
  }
};
