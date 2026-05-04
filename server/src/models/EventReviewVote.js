import { Schema, model } from "mongoose";

const eventReviewVoteSchema = new Schema(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: "eventReview",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    value: {
      type: String,
      enum: ["up", "down"],
      required: true,
    },
  },
  { timestamps: true },
);

eventReviewVoteSchema.index({ reviewId: 1, userId: 1 }, { unique: true });

const EventReviewVote = model("eventReviewVote", eventReviewVoteSchema);

export default EventReviewVote;
