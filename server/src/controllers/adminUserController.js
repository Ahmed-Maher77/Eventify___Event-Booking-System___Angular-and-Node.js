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

    const usersPayload = users.map((doc) => {
      const plain = doc.toObject();
      if (plain.createdAt == null && doc._id?.getTimestamp) {
        plain.createdAt = doc._id.getTimestamp();
      }
      return plain;
    });

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: {
        users: usersPayload,
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

// ---- Get User By ID [Admin ONLY] ----
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password -__v");

    if (!user) {
      throw AppError.notFound("User not found.");
    }

    const userPayload = user.toObject();
    if (userPayload.createdAt == null && user._id?.getTimestamp) {
      userPayload.createdAt = user._id.getTimestamp();
    }
    if (userPayload.updatedAt == null && userPayload.createdAt != null) {
      userPayload.updatedAt = userPayload.createdAt;
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully.",
      data: { user: userPayload },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when retrieving the user."));
  }
};

// ---- Create New Admin [Admin ONLY] ----
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw AppError.badRequest("A user with this email already exists.");
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      role: "admin",
    });

    const userPayload = newAdmin.toObject();
    delete userPayload.password;
    delete userPayload.__v;

    res.status(201).json({
      success: true,
      message: "Admin created successfully.",
      data: { user: userPayload },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when creating the admin."));
  }
};

// ---- Update User Role [Admin ONLY] ----
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      throw AppError.badRequest("Role must be either admin or user.");
    }
    if (req.user?.id?.toString() === id.toString() && role !== "admin") {
      throw AppError.badRequest("You cannot remove your own admin role.");
    }

    const user = await User.findById(id).select("-password -__v");
    if (!user) {
      throw AppError.notFound("User not found.");
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      data: { user },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when updating user role."));
  }
};

// ---- Update User Status [Admin ONLY] ----
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      throw AppError.badRequest("isActive must be a boolean.");
    }
    if (req.user?.id?.toString() === id.toString() && isActive === false) {
      throw AppError.badRequest("You cannot deactivate your own account.");
    }

    const user = await User.findById(id).select("-password -__v");
    if (!user) {
      throw AppError.notFound("User not found.");
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully.`,
      data: { user },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(AppError.internalError("An error occurred when updating user status."));
  }
};

export { getAllUsers, getUserById, createAdmin, updateUserRole, updateUserStatus };

