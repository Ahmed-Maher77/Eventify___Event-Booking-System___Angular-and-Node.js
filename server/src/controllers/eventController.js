import AppError from "../middlewares/AppError.js";
import Event from "../models/Event.js";
import mongoose from "mongoose";
import parseurl from "parseurl";
import {
    deleteCloudinaryImage,
    uploadImageBuffer,
} from "../utils/cloudinaryUpload.js";

/** Normalize `categories` query (string, repeated keys, or qs array/object) into a list of slugs. */
const parseCategoriesQueryParam = (raw) => {
    if (raw === undefined || raw === null) {
        return [];
    }
    if (Array.isArray(raw)) {
        return [
            ...new Set(
                raw
                    .flatMap((item) => String(item).split(","))
                    .map((c) => c.trim().toLowerCase())
                    .filter(Boolean)
                    .filter((c) => c !== "all"),
            ),
        ];
    }
    if (typeof raw === "object") {
        return [
            ...new Set(
                Object.values(raw)
                    .flatMap((item) => String(item).split(","))
                    .map((c) => c.trim().toLowerCase())
                    .filter(Boolean)
                    .filter((c) => c !== "all"),
            ),
        ];
    }
    const s = String(raw).trim();
    if (!s || s === "[object Object]") {
        return [];
    }
    return [
        ...new Set(
            s
                .split(",")
                .map((c) => c.trim().toLowerCase())
                .filter(Boolean)
                .filter((c) => c !== "all"),
        ),
    ];
};

/**
 * Every `categories=` value from the request URL (duplicate-safe).
 * Prefer `parseurl(req).query` — same source the router uses — then fall back to `originalUrl` / `url`.
 */
const collectCategoriesFromRequestUrl = (req) => {
    const values = [];
    try {
        const parsed = parseurl(req);
        if (parsed?.query) {
            values.push(
                ...new URLSearchParams(parsed.query).getAll("categories"),
            );
        }
    } catch {
        /* ignore */
    }
    const urls = [req.originalUrl, req.url].filter(
        (u) => typeof u === "string" && u.length > 0,
    );
    for (const url of urls) {
        const qIdx = url.indexOf("?");
        if (qIdx === -1) {
            continue;
        }
        const qs = url.slice(qIdx + 1).split("#")[0];
        try {
            values.push(...new URLSearchParams(qs).getAll("categories"));
        } catch {
            /* ignore */
        }
    }
    return values;
};

// ======= Get all events (public) =======
// /api/events?categories=concert,workshop — optional legacy alias: ?category=concert (same as categories=concert)
const getEvents = async (req, res) => {
    try {
        // Extract query parameters with defaults
        const {
            page = 1,
            limit = 10,
            search = "",
            name = "",
            location = "",
            minPrice,
            maxPrice,
            startDate,
            endDate,
            status = "",
            sort = "date",
            order = "desc",
        } = req.query;

        // Handle pagination parameters
        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.max(parseInt(limit) || 10, 1);
        const skip = (pageNumber - 1) * limitNumber;

        const featuredCategories = [
            "concert",
            "conference",
            "workshop",
            "seminar",
            "sports",
        ];
        const allowedCategoryValues = [...featuredCategories, "other"];

        // Build filter criteria object (category + text search may both need $or — use $and parts)
        const filter = {};
        const andParts = [];

        if (search) {
            andParts.push({
                $or: [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                ],
            });
        }

        const urlCategoryStrings = collectCategoriesFromRequestUrl(req);
        const fromQuery = parseCategoriesQueryParam(req.query.categories);
        const fromCategoryAlias = parseCategoriesQueryParam(req.query.category);
        const fromUrl = parseCategoriesQueryParam(urlCategoryStrings);
        let categoryList = [
            ...new Set([...fromQuery, ...fromCategoryAlias, ...fromUrl]),
        ];

        if (categoryList.length > 0) {
            const normalized = [...new Set(categoryList)].filter((c) =>
                allowedCategoryValues.includes(c),
            );
            if (normalized.length > 0) {
                const hasOther = normalized.includes("other");
                const withoutOther = normalized.filter((c) => c !== "other");

                if (hasOther && withoutOther.length > 0) {
                    andParts.push({
                        $or: [
                            { category: { $in: withoutOther } },
                            { category: { $nin: featuredCategories } },
                        ],
                    });
                } else if (hasOther) {
                    andParts.push({ category: { $nin: featuredCategories } });
                } else {
                    andParts.push({ category: { $in: withoutOther } });
                }
            }
        }

        if (andParts.length === 1) {
            Object.assign(filter, andParts[0]);
        } else if (andParts.length > 1) {
            filter.$and = andParts;
        }

        if (name) {
            filter.title = { $regex: name, $options: "i" };
        }

        if (location) {
            filter.location = { $regex: location, $options: "i" };
        }

        // Only add bounds that are present and numeric. If `minPrice=` / `maxPrice=` appear as empty
        // strings, `filter.price = {}` alone matches no numeric `price` field in MongoDB → zero rows.
        const priceGte =
            minPrice !== undefined &&
            minPrice !== "" &&
            !Number.isNaN(Number(minPrice))
                ? Number(minPrice)
                : null;
        const priceLte =
            maxPrice !== undefined &&
            maxPrice !== "" &&
            !Number.isNaN(Number(maxPrice))
                ? Number(maxPrice)
                : null;
        if (priceGte !== null || priceLte !== null) {
            filter.price = {};
            if (priceGte !== null) {
                filter.price.$gte = priceGte;
            }
            if (priceLte !== null) {
                filter.price.$lte = priceLte;
            }
        }

        const startD =
            startDate && String(startDate).trim()
                ? new Date(startDate)
                : null;
        const endD =
            endDate && String(endDate).trim() ? new Date(endDate) : null;
        const startOk = startD && !Number.isNaN(startD.getTime());
        const endOk = endD && !Number.isNaN(endD.getTime());
        if (startOk || endOk) {
            filter.date = {};
            if (startOk) {
                filter.date.$gte = startD;
            }
            if (endOk) {
                filter.date.$lte = endD;
            }
        }

        const allowedStatuses = [
            "upcoming",
            "ongoing",
            "completed",
            "cancelled",
        ];
        if (status && allowedStatuses.includes(String(status).toLowerCase())) {
            filter.status = String(status).toLowerCase();
        }

        const allowedSortFields = ["date", "price", "title", "createdAt"];
        const sortField = allowedSortFields.includes(sort) ? sort : "date";
        const sortOrder = order === "asc" ? 1 : -1;



        // Get events and total count in parallel
        const [events, totalEvents] = await Promise.all([
            Event.find(filter)
                .populate("createdBy", "name")
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limitNumber),
            Event.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalEvents / limitNumber);



        // Send response with events and pagination info
        res.status(200).json({
            success: true,
            message: "Events retrieved successfully",
            data: {
                events,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalEvents,
                    limit: limitNumber,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error while retrieving events",
        });
        // throw new AppError("Server error while retrieving events", 500);
    }
};

// ======= Get single event (public) =======
const getEvent = async (req, res) => {
    try {
        // extract id from route params
        const { id } = req.params;

        // ensure id exists and valid
        if (!id) {
            throw new AppError("Event ID is required", 400);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid Event ID", 400);
        }

        // search for event by id
        const existingEvent = await Event.findById(id).populate(
            "createdBy",
            "_id name",
        );

        // ensure it exists
        if (!existingEvent) {
            throw new AppError("Event not found", 404);
        }

        // send reposnse with event data
        res.status(200).json({
            success: true,
            message: "Event retrieved successfully",
            data: existingEvent,
        });
    } catch (error) {
        throw new AppError("Server error while retrieving event", 500);
    }
};

// ======= Create new event (admin only) =======
const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            location,
            category,
            capacity,
            price,
            imageUrl,
        } = req.body;

        const creatorId = req.user?.id || req.body.createdBy;

        if (!creatorId || !mongoose.Types.ObjectId.isValid(creatorId)) {
            throw AppError.unauthorized(
                "Authentication required to create event",
            );
        }

        // create new event instance + save it in db
        const newEvent = new Event({
            title,
            description,
            date,
            location,
            category,
            capacity: Number(capacity),
            price: Number(price),
            createdBy: creatorId,
        });

        // if image is provided, set it to the event
        if (imageUrl && imageUrl.trim() !== "") {
            newEvent.image = imageUrl.trim();
        } else if (req.file) {
            const uploadedImage = await uploadImageBuffer(req.file.buffer);
            newEvent.image = uploadedImage.secure_url;
            newEvent.imagePublicId = uploadedImage.public_id;
        }

        // save the event to the database
        await newEvent.save();

        // send response with the created event data
        res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: newEvent,
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError("Server error while creating event", 500);
    }
};

// ======= Update event (admin only) =======
const updateEvent = async (req, res) => {
    try {
        // extract id from url params
        const { id } = req.params;

        // ensure id exists and valid
        if (!id) {
            throw new AppError("Event ID is required", 400);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid Event ID", 400);
        }

        // search for event by id
        const existingEvent = await Event.findById(id);

        // ensure event exists
        if (!existingEvent) {
            throw new AppError("Event not found", 404);
        }

        // update event fields + save
        const updatableFields = [
            "title",
            "description",
            "date",
            "location",
            "category",
            "capacity",
            "price",
        ];
        updatableFields.forEach((field) => {
            if (req.body.hasOwnProperty(field)) {
                existingEvent[field] = req.body[field];
            }
        });

        if (req.file) {
            const uploadedImage = await uploadImageBuffer(req.file.buffer);
            if (existingEvent.imagePublicId) {
                await deleteCloudinaryImage(existingEvent.imagePublicId);
            }
            existingEvent.image = uploadedImage.secure_url;
            existingEvent.imagePublicId = uploadedImage.public_id;
        } else if (req.body.imageUrl && req.body.imageUrl.trim() !== "") {
            if (existingEvent.imagePublicId) {
                await deleteCloudinaryImage(existingEvent.imagePublicId);
                existingEvent.imagePublicId = null;
            }
            existingEvent.image = req.body.imageUrl.trim();
        }

        await existingEvent.save();

        // send reposnse with the updated event data
        res.status(200).json({
            success: true,
            message: "Event updated successfully",
            data: existingEvent,
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError("Server error while updating event", 500);
    }
};

// ======= Delete event (admin only) =======
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // ensure id exists and valid
        if (!id) {
            throw new AppError("Event ID is required", 400);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid Event ID", 400);
        }

        // delete event
        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) {
            throw new AppError("Event not found", 404);
        }

        if (deletedEvent.imagePublicId) {
            await deleteCloudinaryImage(deletedEvent.imagePublicId);
        }

        // send response confirming deletion
        res.status(200).json({
            success: true,
            message: "Event deleted successfully",
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError("Server error while deleting event", 500);
    }
};

export { getEvents, getEvent, createEvent, updateEvent, deleteEvent };
