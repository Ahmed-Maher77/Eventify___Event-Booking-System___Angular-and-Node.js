import mongoose from "mongoose";
import AppError from "../middlewares/AppError.js";
import { getStripe } from "../config/stripe.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";

const CANCELLATION_CUTOFF_HOURS = 48;

//         ==> GET <==
// ---- Get User's Bookings ----
const getUsersBookings = async (req, res, next) => {
    try {
        // Query Parameters
        const { status } = req.query;

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        // Filter — only the authenticated user's bookings
        const filter = { userId: req.user.id };
        if (status) filter.status = status;

        // Calculate Skip
        const skip = (page - 1) * limit;

        // Get Bookings
        const bookings = await Booking.find(filter)
            .populate("userId", "name email")
            .populate("eventId", "title date location")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalNumberOfBookings = await Booking.countDocuments(filter);
        const totalPages = Math.ceil(totalNumberOfBookings / limit);

        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            data: {
                bookings: bookings,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalBookings: totalNumberOfBookings,
                    limit: limit,
                },
            },
        });
    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(
            AppError.internalError(
                "An error occurred when retrieving bookings.",
            ),
        );
    }
};

// ---- Get Active Booking for Current User + Event ----
const getActiveBookingForEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            throw AppError.badRequest("Invalid Event ID.");
        }

        const booking = await Booking.findOne({
            userId: req.user.id,
            eventId,
            status: { $in: ["pending", "confirmed"] },
        })
            .sort({ createdAt: -1 })
            .populate("userId", "name email")
            .populate("eventId", "title date location");

        res.status(200).json({
            success: true,
            message: "Active booking lookup completed.",
            data: booking ?? null,
        });
    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(
            AppError.internalError(
                "An error occurred when checking active booking.",
            ),
        );
    }
};

//              ==> GET <==
// ---- Get All Bookings [Admin ONLY] ----
const getAllBookings = async (req, res, next) => {
    try {
        // Query Parameters
        const { status, userId, eventId, search, sort, order } = req.query;

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filter
        const filter = {};
        if (status) filter.status = status;
        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId))
                throw AppError.badRequest("Invalid User ID.");
            filter.userId = userId;
        }
        if (eventId) {
            if (!mongoose.Types.ObjectId.isValid(eventId))
                throw AppError.badRequest("Invalid Event ID.");
            filter.eventId = eventId;
        }

        const trimmedSearch = typeof search === "string" ? search.trim() : "";
        if (trimmedSearch) {
            const searchRegex = new RegExp(trimmedSearch, "i");
            const matchedUsers = await mongoose.model("user").find(
                {
                    $or: [{ name: searchRegex }, { email: searchRegex }],
                },
                { _id: 1 },
            );
            const userIds = matchedUsers.map((user) => user._id);

            const matchedEvents = await mongoose
                .model("event")
                .find({ title: searchRegex }, { _id: 1 });
            const eventIds = matchedEvents.map((event) => event._id);

            filter.$or = [
                ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
                ...(eventIds.length ? [{ eventId: { $in: eventIds } }] : []),
            ];

            if (!filter.$or.length) {
                filter.$or = [{ _id: { $in: [] } }];
            }
        }

        const sortField = [
            "createdAt",
            "status",
            "quantity",
            "totalPrice",
        ].includes(sort)
            ? sort
            : "createdAt";
        const sortOrder = order === "asc" ? 1 : -1;
        const sorting = { [sortField]: sortOrder };

        const bookings = await Booking.find(filter)
            .populate("userId", "name email")
            .populate("eventId", "title date location")
            .sort(sorting)
            .skip(skip)
            .limit(limit);

        const totalNumberOfBookings = await Booking.countDocuments(filter);
        const totalPages = Math.ceil(totalNumberOfBookings / limit);
        const statusBaseFilter = { ...filter };
        delete statusBaseFilter.status;

        const [pendingCount, confirmedCount, cancelledCount] =
            await Promise.all([
                Booking.countDocuments({
                    ...statusBaseFilter,
                    status: "pending",
                }),
                Booking.countDocuments({
                    ...statusBaseFilter,
                    status: "confirmed",
                }),
                Booking.countDocuments({
                    ...statusBaseFilter,
                    status: "cancelled",
                }),
            ]);

        res.status(200).json({
            success: true,
            message: "All bookings retrieved successfully",
            data: {
                bookings,
                statusCounts: {
                    all: pendingCount + confirmedCount + cancelledCount,
                    pending: pendingCount,
                    confirmed: confirmedCount,
                    cancelled: cancelledCount,
                },
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalBookings: totalNumberOfBookings,
                    limit,
                },
            },
        });
    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(
            AppError.internalError(
                "An error occurred when retrieving all bookings.",
            ),
        );
    }
};

//        ==> GET <==
// ---- Get Single Bookings ----
const getSingleBooking = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) throw AppError.badRequest("Booking ID is required");
        if (!mongoose.Types.ObjectId.isValid(id))
            throw new AppError("Invalid Booking ID", 400);

        const booking = await Booking.findById(id)
            .populate("userId", "name email")
            .populate("eventId", "title date location");

        if (!booking) throw AppError.notFound("Booking not found");

        res.status(200).json({
            success: true,
            message: "Booking retrieved successfully",
            data: booking,
        });
    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(
            AppError.internalError(
                "An error occurred when retrieving the booking.",
            ),
        );
    }
};

//         ==> POST <==
// ---- Create new Booking ----
const createBooking = async (req, res, next) => {
    try {
        const { eventId, quantity } = req.body;

        if (!eventId) throw AppError.badRequest("Event ID is required.");
        if (!mongoose.Types.ObjectId.isValid(eventId))
            throw AppError.badRequest("Invalid Event ID.");

        if (!quantity)
            throw AppError.badRequest("Booking Quantity is required.");
        if (quantity < 0)
            throw AppError.badRequest("Booking Quantity must be positive.");

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) throw AppError.notFound("Event is not found.");

        const eventDate = new Date(event.date);
        if (
            Number.isFinite(eventDate.getTime()) &&
            eventDate.getTime() <= Date.now()
        ) {
            throw AppError.badRequest(
                "Booking is closed because this event date has already passed.",
            );
        }

        // Check if event has available seats
        if (event.availableSeats <= 0) {
            throw AppError.badRequest(
                "This event is sold out. No seats are available.",
            );
        }

        if (quantity > event.availableSeats)
            throw AppError.badRequest(
                "Booking Quantity must not exceed the Available Seats.",
            );

        // Prevent duplicate active bookings (pending/confirmed) per user per event.
        const existingActiveBooking = await Booking.findOne({
            userId: req.user.id,
            eventId,
            status: { $in: ["pending", "confirmed"] },
        }).select("_id status quantity");
        if (existingActiveBooking) {
            throw AppError.badRequest(
                "You already have an active booking for this event. Please manage it from My Bookings.",
            );
        }

        // Calculate total price (quantity × event price)
        const totalPrice = quantity * event.price;

        const status = totalPrice <= 0 ? "confirmed" : "pending";

        // Create booking
        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            quantity,
            totalPrice,
            status,
        });
        await booking.populate("userId", "name email");
        await booking.populate("eventId", "title date location");

        // Update event availableSeats
        event.availableSeats -= quantity;
        await event.save();

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return next(
                AppError.badRequest(
                    "You already have an active booking for this event. Please manage it from My Bookings.",
                ),
            );
        }
        if (error instanceof AppError) return next(error);
        next(
            AppError.internalError(
                "An error occurred when creating the booking.",
            ),
        );
    }
};

// Booking status is not editable by admins manually: it follows user actions
// (cancel), and later payment/provider webhooks or automated rules.

// ---- Update Booking Quantity [Owner/Admin] ----
const updateBookingQuantity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const nextQuantity = Number(req.body.quantity);

        if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
            throw AppError.badRequest("Quantity must be a positive integer.");
        }

        const booking = await Booking.findById(id).populate(
            "userId",
            "name email",
        );
        if (!booking) throw AppError.notFound("Booking not found");

        const isOwner =
            booking.userId?._id?.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            throw AppError.forbidden(
                "You do not have permission to update this booking.",
            );
        }

        if (booking.status === "cancelled") {
            throw AppError.badRequest("Cancelled bookings cannot be updated.");
        }

        if (booking.payment?.paidAt) {
            throw AppError.badRequest(
                "Quantity cannot be changed after payment; cancel for a refund or contact support.",
            );
        }
        const event = await Event.findById(booking.eventId);
        if (!event) throw AppError.notFound("Event is not found.");

        const currentQuantity = Number(booking.quantity) || 1;
        const quantityDiff = nextQuantity - currentQuantity;
        if (quantityDiff === 0) {
            await booking.populate("eventId", "title date location");
            return res.status(200).json({
                success: true,
                message: "Booking quantity unchanged.",
                data: booking,
            });
        }

        if (quantityDiff > 0) {
            if (event.availableSeats < quantityDiff) {
                throw AppError.badRequest(
                    `Only ${event.availableSeats} seats available.`,
                );
            }
            event.availableSeats -= quantityDiff;
        } else {
            event.availableSeats += Math.abs(quantityDiff);
        }

        booking.quantity = nextQuantity;
        booking.totalPrice = nextQuantity * (Number(event.price) || 0);

        if (booking.payment?.paymentIntentId) {
            const stripe = getStripe();
            if (stripe) {
                await stripe.paymentIntents
                    .cancel(booking.payment.paymentIntentId)
                    .catch(() => {});
            }
            booking.payment.paymentIntentId = null;
            booking.payment.paymentStatus = null;
        }

        await Promise.all([event.save(), booking.save()]);
        await booking.populate("eventId", "title date location");

        res.status(200).json({
            success: true,
            message: "Booking quantity updated successfully.",
            data: booking,
        });
    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(
            AppError.internalError(
                "An error occurred when updating booking quantity.",
            ),
        );
    }
};

//      ==> DELETE <==
// ---- Cancel Booking ----
const cancelBooking = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Verify booking exists
        if (!id) throw AppError.badRequest("Booking ID is required");
        if (!mongoose.Types.ObjectId.isValid(id))
            throw new AppError("Invalid Booking ID", 400);

        // 2. Check if user owns booking or is admin
        const booking = await Booking.findById(id)
            .populate("userId", "name email")
            .populate("eventId", "title date location");
        if (!booking) throw AppError.notFound("Booking not found");

        const isOwner =
            booking.userId._id.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin)
            throw AppError.forbidden(
                "You do not have permission to cancel this booking.",
            );

        if (booking.status === "cancelled") {
            throw AppError.badRequest("Booking is already cancelled.");
        }

        const eventDateValue =
            booking.eventId && typeof booking.eventId === "object"
                ? booking.eventId.date
                : null;
        if (eventDateValue) {
            const eventDate = new Date(eventDateValue);
            if (!Number.isNaN(eventDate.getTime())) {
                const cutoffMs = CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
                if (eventDate.getTime() - Date.now() < cutoffMs) {
                    throw AppError.badRequest(
                        "Cancellation is unavailable within 48 hours of the event start time.",
                    );
                }
            }
        }

        const stripe = getStripe();

        if (booking.payment?.paidAt && booking.payment?.paymentIntentId) {
            if (!stripe) {
                return next(
                    AppError.internalError(
                        "Payment refund service is not configured.",
                    ),
                );
            }
            try {
                const refund = await stripe.refunds.create({
                    payment_intent: booking.payment.paymentIntentId,
                });
                booking.payment.refundId = refund.id;
                booking.payment.refundStatus = refund.status;
            } catch (refundErr) {
                return next(
                    AppError.badRequest(
                        refundErr?.message ||
                            "Unable to process refund. Please contact support.",
                    ),
                );
            }
        } else if (
            booking.payment?.paymentIntentId &&
            stripe &&
            !booking.payment?.paidAt
        ) {
            await stripe.paymentIntents
                .cancel(booking.payment.paymentIntentId)
                .catch(() => {});
        }

        // 3. Update booking status to "cancelled"
        booking.status = "cancelled";

        // 4. Restore event availableSeats
        const event = await Event.findById(booking.eventId);
        if (event) {
            event.availableSeats += booking.quantity;
            await event.save();
        }

        await booking.save();

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
        });
    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(
            AppError.internalError(
                "An error occurred when cancelling the booking.",
            ),
        );
    }
};

// ---- Delete Cancelled Booking Permanently [Owner/Admin] ----
const deleteCancelledBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) throw AppError.badRequest("Booking ID is required");
        if (!mongoose.Types.ObjectId.isValid(id))
            throw new AppError("Invalid Booking ID", 400);

        const booking = await Booking.findById(id).populate(
            "userId",
            "name email",
        );
        if (!booking) throw AppError.notFound("Booking not found");

        const isOwner =
            booking.userId?._id?.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            throw AppError.forbidden(
                "You do not have permission to remove this booking.",
            );
        }

        if (booking.status !== "cancelled") {
            throw AppError.badRequest(
                "Only cancelled bookings can be removed.",
            );
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            message: "Cancelled booking removed successfully.",
        });
    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(
            AppError.internalError(
                "An error occurred when deleting the booking.",
            ),
        );
    }
};

// ---- Admin booking operation: before event => delete + refund, after event => delete only ----
const adminDeleteBookingByEventDateRule = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) throw AppError.badRequest("Booking ID is required");
        if (!mongoose.Types.ObjectId.isValid(id))
            throw new AppError("Invalid Booking ID", 400);

        const booking = await Booking.findById(id)
            .populate("userId", "name email")
            .populate("eventId", "title date location");
        if (!booking) throw AppError.notFound("Booking not found");

        const eventDateValue =
            booking.eventId && typeof booking.eventId === "object"
                ? booking.eventId.date
                : null;
        const parsedEventDate = eventDateValue
            ? new Date(eventDateValue)
            : null;
        if (!parsedEventDate || Number.isNaN(parsedEventDate.getTime())) {
            throw AppError.badRequest("Booking event date is invalid.");
        }

        const isBeforeEvent = parsedEventDate.getTime() > Date.now();
        const canRefund =
            isBeforeEvent &&
            booking.status !== "cancelled" &&
            !!booking.payment?.paidAt &&
            !!booking.payment?.paymentIntentId;
        const stripe = getStripe();
        let refundCreated = false;

        // Before event: apply refund workflow for paid bookings.
        if (canRefund) {
            if (!stripe) {
                return next(
                    AppError.internalError(
                        "Payment refund service is not configured.",
                    ),
                );
            }
            if (booking.payment.refundStatus !== "succeeded") {
                try {
                    const refund = await stripe.refunds.create({
                        payment_intent: booking.payment.paymentIntentId,
                    });
                    booking.payment.refundId = refund.id;
                    booking.payment.refundStatus = refund.status;
                    refundCreated = refund.status === "succeeded";
                } catch (refundErr) {
                    return next(
                        AppError.badRequest(
                            refundErr?.message ||
                                "Unable to process refund. Please contact support.",
                        ),
                    );
                }
            } else {
                refundCreated = true;
            }
        }

        if (
            isBeforeEvent &&
            booking.status !== "cancelled" &&
            booking.payment?.paymentIntentId &&
            !booking.payment?.paidAt &&
            stripe
        ) {
            await stripe.paymentIntents
                .cancel(booking.payment.paymentIntentId)
                .catch(() => {});
        }

        // Before event: release held seats back to event pool (if applicable).
        if (isBeforeEvent && booking.status !== "cancelled") {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += booking.quantity;
                await event.save();
            }
        }

        // Keep refunded bookings as cancelled history for user visibility/audit.
        // Delete-only paths still remove the booking permanently.
        if (canRefund) {
            booking.status = "cancelled";
            await booking.save();
        } else {
            await booking.deleteOne();
        }

        const actionLabel = canRefund ? "Cancel & refund" : "Delete";
        const message = canRefund
            ? "Cancel & refund completed. Booking moved to cancelled history."
            : `${actionLabel} completed successfully.`;

        res.status(200).json({
            success: true,
            message,
            data: {
                action: canRefund ? "cancel_refund" : "delete_only",
                refunded: refundCreated,
            },
        });
    } catch (error) {
        if (error instanceof AppError) return next(error);
        next(
            AppError.internalError(
                "An error occurred when processing this admin booking operation.",
            ),
        );
    }
};

export {
    createBooking,
    cancelBooking,
    deleteCancelledBooking,
    adminDeleteBookingByEventDateRule,
    getUsersBookings,
    getActiveBookingForEvent,
    getSingleBooking,
    updateBookingQuantity,
    getAllBookings,
};
