import User from "../models/User.js";
import { generateToken } from "../utils/jwtUtils.js";
import AppError from "../middlewares/AppError.js";
import { deleteCloudinaryImage, uploadImageBuffer } from "../utils/cloudinaryUpload.js";
import { buildFallbackAvatarUrl } from "../utils/avatarUtils.js";
import {
    getAuthCookieClearOptions,
    getAuthCookieName,
    getAuthCookieOptions
} from "../utils/authCookie.js";

export const register = async (req, res) => {
    const { email, password, name, pictureUrl } = req.body;
    if (!name || !email || !password) {
        throw new AppError("name and email and password are required", 400);
    }

    const exists = await User.findOne({ email });
    if (exists) {
        throw new AppError("Email already exists", 409);
    }

    let finalPictureUrl = typeof pictureUrl === "string" ? pictureUrl.trim() : "";
    let picturePublicId = "";

    if (req.file) {
        const uploadedImage = await uploadImageBuffer(req.file.buffer, {
            folder: "eventify/users",
        });
        finalPictureUrl = uploadedImage.secure_url;
        picturePublicId = uploadedImage.public_id;
    }

    if (!finalPictureUrl) {
        finalPictureUrl = buildFallbackAvatarUrl(name);
    }

    const user = new User({
        name,
        email,
        password,
        pictureUrl: finalPictureUrl,
        picturePublicId,
    });
    await user.save()
    const token = generateToken(user._id, user.role);
    res.cookie(getAuthCookieName(), token, getAuthCookieOptions());
    res.status(201).json({
        data: user, token, message: "User registered successfully", success: true,
    });
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new AppError("email and password are required", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError("invalid email or password", 401);
    }
    if (user.isActive === false) {
        throw new AppError("Your account is deactivated. Please contact support.", 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError("invalid email or password", 401);
    }

    const token = generateToken(user._id, user.role);
    res.cookie(getAuthCookieName(), token, getAuthCookieOptions());
    res.json({ success: true, message: "Login successful", data: user, token, });
};

export const logout = async (req, res) => {
    res.clearCookie(getAuthCookieName(), getAuthCookieClearOptions());
    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
};

export const updateMyProfile = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw AppError.unauthorized("Authentication required");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw AppError.notFound("User account not found.");
    }

    const hasName = Object.prototype.hasOwnProperty.call(req.body ?? {}, "name");
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
    const location = typeof req.body?.location === "string" ? req.body.location.trim() : "";
    const hasEmailNotificationsEnabled = Object.prototype.hasOwnProperty.call(
        req.body ?? {},
        "emailNotificationsEnabled",
    );
    const hasMarketingUpdatesEnabled = Object.prototype.hasOwnProperty.call(
        req.body ?? {},
        "marketingUpdatesEnabled",
    );
    const hasBookingRemindersEnabled = Object.prototype.hasOwnProperty.call(
        req.body ?? {},
        "bookingRemindersEnabled",
    );

    if (hasName && !name) {
        throw AppError.badRequest("Name is required.");
    }
    if (hasName && (name.length < 2 || name.length > 50)) {
        throw AppError.badRequest("Name must be between 2 and 50 characters.");
    }
    if (phone.length > 40) {
        throw AppError.badRequest("Phone must be at most 40 characters.");
    }
    if (location.length > 120) {
        throw AppError.badRequest("Location must be at most 120 characters.");
    }
    if (
        hasEmailNotificationsEnabled &&
        typeof req.body.emailNotificationsEnabled !== "boolean"
    ) {
        throw AppError.badRequest("emailNotificationsEnabled must be a boolean.");
    }
    if (
        hasMarketingUpdatesEnabled &&
        typeof req.body.marketingUpdatesEnabled !== "boolean"
    ) {
        throw AppError.badRequest("marketingUpdatesEnabled must be a boolean.");
    }
    if (
        hasBookingRemindersEnabled &&
        typeof req.body.bookingRemindersEnabled !== "boolean"
    ) {
        throw AppError.badRequest("bookingRemindersEnabled must be a boolean.");
    }

    if (hasName) {
        user.name = name;
    }
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "phone")) {
        user.phone = phone;
    }
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "location")) {
        user.location = location;
    }
    if (hasEmailNotificationsEnabled) {
        user.emailNotificationsEnabled = req.body.emailNotificationsEnabled;
    }
    if (hasMarketingUpdatesEnabled) {
        user.marketingUpdatesEnabled = req.body.marketingUpdatesEnabled;
    }
    if (hasBookingRemindersEnabled) {
        user.bookingRemindersEnabled = req.body.bookingRemindersEnabled;
    }
    if (req.file) {
        const uploadedImage = await uploadImageBuffer(req.file.buffer, {
            folder: "eventify/users",
        });
        const previousPublicId = user.picturePublicId;
        user.pictureUrl = uploadedImage.secure_url;
        user.picturePublicId = uploadedImage.public_id;
        if (previousPublicId && previousPublicId !== user.picturePublicId) {
            await deleteCloudinaryImage(previousPublicId);
        }
    }
    // Avoid re-validating unchanged password when saving profile/preferences.
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        data: {
            id: String(user._id),
            role: user.role,
            name: user.name,
            email: user.email,
            pictureUrl: user.pictureUrl,
            phone: user.phone || "",
            location: user.location || "",
            emailNotificationsEnabled: user.emailNotificationsEnabled,
            marketingUpdatesEnabled: user.marketingUpdatesEnabled,
            bookingRemindersEnabled: user.bookingRemindersEnabled,
        },
    });
};

export const updateMyPassword = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw AppError.unauthorized("Authentication required");
    }

    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    const confirmPassword = typeof req.body?.confirmPassword === "string" ? req.body.confirmPassword : "";

    if (!currentPassword || !newPassword || !confirmPassword) {
        throw AppError.badRequest("Current password, new password, and confirm password are required.");
    }
    if (newPassword !== confirmPassword) {
        throw AppError.badRequest("New password and confirm password do not match.");
    }
    if (newPassword.length < 6) {
        throw AppError.badRequest("New password must be at least 6 characters.");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw AppError.notFound("User account not found.");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw AppError.badRequest("Current password is incorrect.");
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password updated successfully.",
    });
};

export const deleteMyAccount = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw AppError.unauthorized("Authentication required");
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
        throw AppError.notFound("User account not found.");
    }

    res.clearCookie(getAuthCookieName(), getAuthCookieClearOptions());
    res.status(200).json({
        success: true,
        message: "Your account was deleted successfully.",
    });
};
