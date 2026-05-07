import AssistantActivity from "../models/AssistantActivity.js";

/**
 * Get all assistant activities for admin dashboard
 * Supports pagination
 */
export const getAllAssistantActivities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      AssistantActivity.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AssistantActivity.countDocuments(),
    ]);

    res.status(200).json({
      status: "success",
      results: activities.length,
      total,
      data: {
        activities,
      },
    });
  } catch (error) {
    next(error);
  }
};
