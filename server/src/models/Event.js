import { Schema, model } from "mongoose";

const eventSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Event title is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Event description is required"],
            trim: true,
        },
        date: {
            type: Date,
            required: [true, "Event date is required"],
        },
        location: {
            type: String,
            required: [true, "Event location is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Event category is required"],
            enum: {
                values: [
                    "concert",
                    "conference",
                    "workshop",
                    "seminar",
                    "sports",
                    "other",
                ],
                message: "Invalid event category",
            },
            trim: true,
        },
        capacity: {
            type: Number,
            required: [true, "Event capacity is required"],
            min: [1, "Capacity must be at least 1"],
        },
        availableSeats: {
            type: Number,
            min: [0, "Available seats cannot be negative"],
            default: function () {
                return this.capacity;
            },
        },
        price: {
            type: Number,
            required: [true, "Event price is required"],
            min: [0, "Price cannot be negative"],
        },
        status: {
            type: String,
            enum: ["upcoming", "ongoing", "completed", "cancelled"],
            default: "upcoming",
        },
        image: {
            type: String,
            default: "/files/images/event-placeholder.svg",
        },
        imagePublicId: {
            type: String,
            default: null,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: [true, "Event creator is required"],
        },
    },
    {
        timestamps: true,
    },
);

const Event = model("Event", eventSchema);

export default Event;
