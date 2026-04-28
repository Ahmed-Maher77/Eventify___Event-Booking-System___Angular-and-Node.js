import { Schema, model } from "mongoose";

const contactMessageSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters."],
      maxlength: [80, "Full name must be less than 80 characters."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please provide a valid email address."],
    },
    subject: {
      type: String,
      required: [true, "Subject is required."],
      trim: true,
      minlength: [4, "Subject must be at least 4 characters."],
      maxlength: [140, "Subject must be less than 140 characters."],
    },
    message: {
      type: String,
      required: [true, "Message is required."],
      trim: true,
      minlength: [10, "Message must be at least 10 characters."],
      maxlength: [2000, "Message must be less than 2000 characters."],
    },
    status: {
      type: String,
      enum: {
        values: ["new", "reviewed"],
        message: "{VALUE} is not a valid status.",
      },
      default: "new",
    },
  },
  { timestamps: true },
);

const ContactMessage = model("ContactMessage", contactMessageSchema);

export default ContactMessage;
