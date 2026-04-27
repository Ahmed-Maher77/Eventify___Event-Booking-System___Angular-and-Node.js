import User from "../models/User.js";
import { generateToken } from "../utils/jwtUtils.js";
import AppError from "../middlewares/AppError.js";
import { uploadImageBuffer } from "../utils/cloudinaryUpload.js";
import { buildFallbackAvatarUrl } from "../utils/avatarUtils.js";

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

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError("invalid email or password", 401);
    }

    const token = generateToken(user._id, user.role);
    res.json({ success: true, message: "Login successful", data: user, token, });
};


