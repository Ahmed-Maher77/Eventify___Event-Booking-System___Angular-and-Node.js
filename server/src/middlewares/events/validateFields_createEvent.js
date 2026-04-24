import mongoose from "mongoose";
import AppError from "../AppError.js";

const validateFields_createEvent = (req, res, next) => {
    const data = req.body;

    // Validate title
    if (!data.title) {
        throw new AppError("Title is required", 400);
    }
    if (
        typeof data.title !== "string" ||
        data.title.trim().length < 3 ||
        data.title.length > 100
    ) {
        throw new AppError("Title must be between 3 and 100 characters", 400);
    }

    // Validate description
    if (!data.description) {
        throw new AppError("Description is required", 400);
    }
    if (
        typeof data.description !== "string" ||
        data.description.trim().length < 10 ||
        data.description.length > 1000
    ) {
        throw new AppError(
            "Description must be between 10 and 1000 characters",
            400,
        );
    }

    // Validate date
    if (!data.date) {
        throw new AppError("Date is required", 400);
    }
    const eventDate = new Date(data.date);
    if (isNaN(eventDate.getTime())) {
        throw new AppError("Date must be a valid date", 400);
    }
    if (eventDate <= new Date()) {
        throw new AppError("Date must be in the future", 400);
    }

    // Validate location
    if (!data.location) {
        throw new AppError("Location is required", 400);
    }
    if (
        typeof data.location !== "string" ||
        data.location.trim().length < 3 ||
        data.location.length > 200
    ) {
        throw new AppError(
            "Location must be between 3 and 200 characters",
            400,
        );
    }

    // Validate category
    if (!data.category) {
        throw new AppError("Category is required", 400);
    }
    const validCategories = [
        "concert",
        "conference",
        "workshop",
        "seminar",
        "sports",
        "other",
    ];
    if (!validCategories.includes(data.category)) {
        throw new AppError(
            "Category must be one of: concert, conference, workshop, seminar, sports, other",
            400,
        );
    }

    // Validate capacity
    if (data.capacity === undefined || data.capacity === null) {
        throw new AppError("Capacity is required", 400);
    }
    const capacityNum = Number(data.capacity);
    if (!Number.isInteger(capacityNum) || capacityNum <= 0) {
        throw new AppError("Capacity must be a positive integer", 400);
    }

    // Validate price
    if (data.price === undefined || data.price === null) {
        throw new AppError("Price is required", 400);
    }
    const priceNum = Number(data.price);
    if (isNaN(priceNum) || priceNum < 0) {
        throw new AppError("Price must be a non-negative number", 400);
    }

    // Ensure createdBy exists and is a valid ObjectId
    const creatorId = req.user?.id || req.body.createdBy;
    if (!creatorId) {
        throw new AppError("The event creator is required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
        throw new AppError("The event creator must be a valid user ID", 400);
    }

    next();
};

export default validateFields_createEvent;
