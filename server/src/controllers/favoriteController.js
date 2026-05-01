import mongoose from "mongoose";
import AppError from "../middlewares/AppError.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

const getUserFavorites = async (req, res, next) => {
    try {
        const user = await User.findById(req.user?.id)
            .populate({
                path: "favorites",
                populate: { path: "createdBy", select: "name" },
                options: { sort: { date: 1 } },
            })
            .lean();

        if (!user) {
            throw AppError.notFound("User not found");
        }

        res.status(200).json({
            success: true,
            message: "Favorites retrieved successfully",
            data: {
                favorites: user.favorites ?? [],
                totalFavorites: user.favorites?.length ?? 0,
            },
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        return next(
            AppError.internalError(
                "An error occurred while retrieving favorites.",
            ),
        );
    }
};

const addFavorite = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            throw AppError.badRequest("Invalid Event ID.");
        }

        const existingEvent = await Event.findById(eventId).select("_id");
        if (!existingEvent) {
            throw AppError.notFound("Event not found.");
        }

        const user = await User.findByIdAndUpdate(
            req.user?.id,
            { $addToSet: { favorites: eventId } },
            { new: true },
        ).select("favorites");

        if (!user) {
            throw AppError.notFound("User not found.");
        }

        res.status(200).json({
            success: true,
            message: "Event added to favorites.",
            data: {
                eventId,
                isFavorite: true,
                totalFavorites: user.favorites.length,
            },
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        return next(
            AppError.internalError("An error occurred while adding favorite."),
        );
    }
};

const removeFavorite = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            throw AppError.badRequest("Invalid Event ID.");
        }

        const user = await User.findByIdAndUpdate(
            req.user?.id,
            { $pull: { favorites: eventId } },
            { new: true },
        ).select("favorites");

        if (!user) {
            throw AppError.notFound("User not found.");
        }

        res.status(200).json({
            success: true,
            message: "Event removed from favorites.",
            data: {
                eventId,
                isFavorite: false,
                totalFavorites: user.favorites.length,
            },
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        return next(
            AppError.internalError(
                "An error occurred while removing favorite.",
            ),
        );
    }
};

const toggleFavorite = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            throw AppError.badRequest("Invalid Event ID.");
        }

        const existingEvent = await Event.findById(eventId).select("_id");
        if (!existingEvent) {
            throw AppError.notFound("Event not found.");
        }

        const user = await User.findById(req.user?.id).select("favorites");
        if (!user) {
            throw AppError.notFound("User not found.");
        }

        const hasFavorite = user.favorites.some(
            (favoriteId) => favoriteId.toString() === eventId,
        );

        if (hasFavorite) {
            user.favorites = user.favorites.filter(
                (favoriteId) => favoriteId.toString() !== eventId,
            );
        } else {
            user.favorites.push(new mongoose.Types.ObjectId(eventId));
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: hasFavorite
                ? "Event removed from favorites."
                : "Event added to favorites.",
            data: {
                eventId,
                isFavorite: !hasFavorite,
                totalFavorites: user.favorites.length,
            },
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        return next(
            AppError.internalError(
                "An error occurred while toggling favorite.",
            ),
        );
    }
};

export { addFavorite, getUserFavorites, removeFavorite, toggleFavorite };
