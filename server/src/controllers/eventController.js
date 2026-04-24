import AppError from "../middlewares/AppError.js";
import Event from "../models/Event.js";
import mongoose from "mongoose";
import {
    deleteCloudinaryImage,
    uploadImageBuffer,
} from "../utils/cloudinaryUpload.js";

// ======= Get all events (public) =======
// /api/events?page=1&limit=10&search=music&category=concert&sort=date&order=desc
const getEvents = async (req, res) => {
    try {
        // Extract query parameters with defaults
        const {
            page = 1,
            limit = 10,
            search = "",
            category = "",
            location = "",
            minPrice,
            maxPrice,
            startDate,
            endDate,
            sort = "date",
            order = "desc",
        } = req.query;

        // Handle pagination parameters
        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.max(parseInt(limit) || 10, 1);
        const skip = (pageNumber - 1) * limitNumber;

        // Build filter criteria object
        const filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        if (category) {
            filter.category = category;
        }

        if (location) {
            filter.location = { $regex: location, $options: "i" };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined && minPrice !== "") {
                filter.price.$gte = Number(minPrice);
            }
            if (maxPrice !== undefined && maxPrice !== "") {
                filter.price.$lte = Number(maxPrice);
            }
        }

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) {
                filter.date.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.date.$lte = new Date(endDate);
            }
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
            imageUrl
        } = req.body;
        
        const creatorId = req.user?.id || req.body.createdBy;

        if (!creatorId || !mongoose.Types.ObjectId.isValid(creatorId)) {
            throw AppError.unauthorized("Authentication required to create event");
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
