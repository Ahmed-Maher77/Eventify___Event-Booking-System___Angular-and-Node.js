import { Schema, model } from "mongoose";

const eventReviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "event",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [2000, "Review message is too long"],
      default: "",
    },
  },
  { timestamps: true },
);

eventReviewSchema.index({ eventId: 1, createdAt: -1 });
eventReviewSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const EventReview = model("eventReview", eventReviewSchema);

export default EventReview;
