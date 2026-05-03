import AppError from "../AppError.js";

const validateFields_updateEvent = (req, res, next) => {
    const data = req.body;

    const updatableFields = [
        "title",
        "description",
        "date",
        "location",
        "category",
        "capacity",
        "price",
    ];

    const hasAtLeastOneField = updatableFields.some((field) =>
        data.hasOwnProperty(field),
    );

    if (!hasAtLeastOneField) {
        throw new AppError(
            "At least one field (title, description, date, location, category, capacity, price) must be provided for update",
            400,
        );
    }

    // Validate title
    if (
        data.hasOwnProperty("title") &&
        (typeof data.title !== "string" ||
            data.title.trim().length < 3 ||
            data.title.length > 100)
    ) {
        throw new AppError("Title must be between 3 and 100 characters", 400);
    }

    // Validate description
    if (
        data.hasOwnProperty("description") &&
        (typeof data.description !== "string" ||
            data.description.trim().length < 10 ||
            data.description.length > 1000)
    ) {
        throw new AppError(
            "Description must be between 10 and 1000 characters",
            400,
        );
    }

    // Validate date
    if (data.hasOwnProperty("date")) {
        const eventDate = new Date(data.date);
        if (isNaN(eventDate.getTime())) {
            throw new AppError("Date must be a valid date", 400);
        }
    }

    // Validate location
    if (
        data.hasOwnProperty("location") &&
        (typeof data.location !== "string" ||
            data.location.trim().length < 3 ||
            data.location.length > 200)
    ) {
        throw new AppError(
            "Location must be between 3 and 200 characters",
            400,
        );
    }

    // Validate category
    const validCategories = [
        "concert",
        "conference",
        "workshop",
        "seminar",
        "sports",
        "other",
    ];
    if (
        data.hasOwnProperty("category") &&
        !validCategories.includes(data.category)
    ) {
        throw new AppError(
            "Category must be one of: concert, conference, workshop, seminar, sports, other",
            400,
        );
    }

    // Validate capacity
    if (data.hasOwnProperty("capacity")) {
        const capacityNum = Number(data.capacity);
        if (!Number.isInteger(capacityNum) || capacityNum <= 0) {
            throw new AppError("Capacity must be a positive integer", 400);
        }
    }

    // Validate price
    if (data.hasOwnProperty("price")) {
        const priceNum = Number(data.price);
        if (isNaN(priceNum) || priceNum < 0) {
            throw new AppError("Price must be a non-negative number", 400);
        }
    }

    next();
};

export default validateFields_updateEvent;
