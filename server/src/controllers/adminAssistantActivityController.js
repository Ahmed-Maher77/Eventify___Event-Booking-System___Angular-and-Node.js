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
    const {
      search,
      status,
      model,
      sort = "createdAt",
      order = "desc",
      minResponseMs,
      maxResponseMs,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    if (typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ userQuery: searchRegex }, { aiResponse: searchRegex }, { model: searchRegex }];
    }

    if (typeof status === "string" && status.trim()) {
      filter.status = status.trim();
    }

    if (typeof model === "string" && model.trim()) {
      filter.model = model.trim();
    }

    if (minResponseMs != null || maxResponseMs != null) {
      filter.responseMs = {};
      if (minResponseMs != null && !Number.isNaN(Number(minResponseMs))) {
        filter.responseMs.$gte = Number(minResponseMs);
      }
      if (maxResponseMs != null && !Number.isNaN(Number(maxResponseMs))) {
        filter.responseMs.$lte = Number(maxResponseMs);
      }
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          filter.createdAt.$lte = end;
        }
      }
    }

    const allowedSortFields = ["createdAt", "responseMs", "relevantEventsCount", "status", "model"];
    const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [activities, total] = await Promise.all([
      AssistantActivity.find(filter)
        .populate("userId", "name email")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      AssistantActivity.countDocuments(filter),
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
