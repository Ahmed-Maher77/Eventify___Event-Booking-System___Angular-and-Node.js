import AppError from "../middlewares/AppError.js";
import User from "../models/User.js";

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//              ==> GET <==
// ---- Get All Users [Admin ONLY] ----
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sort || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const filter = {};

    if (role) {
      filter.role = role;
    }

    const normalizedSearch = typeof search === "string" ? search.trim() : "";
    if (normalizedSearch) {
      const regex = new RegExp(escapeRegex(normalizedSearch), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const sort = { [sortField]: sortOrder };

    const users = await User.find(filter)
      .select("-password -__v")
      .sort(sort)
      .collation({ locale: "en", strength: 2 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          limit,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when retrieving users."));
  }
};

export { getAllUsers };

