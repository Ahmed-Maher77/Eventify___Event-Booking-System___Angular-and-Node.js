import { Schema, model } from "mongoose";

const newsletterSubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please provide a valid email address."],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "unsubscribed"],
        message: "{VALUE} is not a valid status.",
      },
      default: "active",
    },
  },
  { timestamps: true },
);

const NewsletterSubscriber = model(
  "NewsletterSubscriber",
  newsletterSubscriberSchema,
);

export default NewsletterSubscriber;
