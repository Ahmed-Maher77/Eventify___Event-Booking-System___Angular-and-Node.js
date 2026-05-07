import mongoose from "mongoose";

/**
 * AssistantActivity Model
 * Stores logs of interactions between users and the AI assistant
 */
const assistantActivitySchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      index: true,
    },
    userQuery: {
      type: String,
      required: [true, "User query is required"],
    },
    aiResponse: {
      type: String,
      required: [true, "AI response is required"],
    },
    model: {
      type: String,
      required: [true, "Model name is required"],
      default: "llama-3.1-8b-instant",
    },
    responseMs: {
      type: Number,
      required: [true, "Response time is required"],
    },
    relevantEventsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["success", "error", "rate-limited"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for efficient admin querying
assistantActivitySchema.index({ createdAt: -1 });
assistantActivitySchema.index({ userId: 1 });

const AssistantActivity = mongoose.model(
  "assistantactivity",
  assistantActivitySchema
);

export default AssistantActivity;
