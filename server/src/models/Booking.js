import { Schema, model } from "mongoose";

const bookingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A Booking must belong to a user."],
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Booking's Event is required."],
    },
    quantity: {
      type: Number,
      required: [true, "Please specify the number of seats."],
      min: [1, "Quantity must be at least 1."],
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required."],
      min: [0, "Total price cannot be negative."],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled"],
        message: "{VALUE} is not a valid status.",
      },
      default: "pending",
    },
  },
  { timestamps: true },
);

const Booking = model("Booking", bookingSchema);

export default Booking;
