import mongoose from "mongoose";
import AppError from "../middlewares/AppError.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";

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
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    // Calculate Skip
    const skip = (page - 1) * limit;

    // Get Bookings
    const bookings = await Booking.find(filter)
      .populate("userId", "name email")
      .populate("eventId", "title date location")
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
    next(AppError.internalError("An error occurred when retrieving bookings."));
  }
};

//              ==> GET <==
// ---- Get All Bookings [Admin ONLY] ----
const getAllBookings = async (req, res, next) => {
  try {
    // Query Parameters
    const { status, userId, eventId } = req.query;

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

    const bookings = await Booking.find(filter)
      .populate("userId", "name email")
      .populate("eventId", "title date location")
      .skip(skip)
      .limit(limit);

    const totalNumberOfBookings = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalNumberOfBookings / limit);

    res.status(200).json({
      success: true,
      message: "All bookings retrieved successfully",
      data: {
        bookings,
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
      AppError.internalError("An error occurred when retrieving all bookings."),
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
      AppError.internalError("An error occurred when retrieving the booking."),
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

    if (!quantity) throw AppError.badRequest("Booking Quantity is required.");
    if (quantity < 0)
      throw AppError.badRequest("Booking Quantity must be positive.");

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) throw AppError.notFound("Event is not found.");

    // Check if event has available seats
    if (event.availableSeats < 0)
      throw AppError.badRequest("Not enough available seats.");

    if (quantity > event.availableSeats)
      throw AppError.badRequest(
        "Booking Quantity must not exceed the Available Seats.",
      );

    // Calculate total price (quantity × event price)
    const totalPrice = quantity * event.price;

    // Create booking
    const booking = await Booking.create({
      userId: req.user._id,
      eventId,
      quantity,
      totalPrice,
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
    if (error instanceof AppError) return next(error);
    next(
      AppError.internalError("An error occurred when creating the booking."),
    );
  }
};

//              ==> PATCH <==
// ---- Update Booking Status [Admin ONLY] ----
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) throw AppError.badRequest("Booking status is required");

    const validStatuses = ["confirmed", "pending", "cancelled"];
    if (!validStatuses.includes(status))
      throw AppError.badRequest(`Invalid booking status.`);

    if (!mongoose.Types.ObjectId.isValid(id))
      throw new AppError("Invalid Booking ID", 400);

    const booking = await Booking.findById(id)
      .populate("userId", "name email")
      .populate("eventId", "title date location");

    if (!booking) throw AppError.notFound("Booking not found");

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(
      AppError.internalError("An error occurred when updating the booking."),
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

    const isOwner = booking.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin)
      throw AppError.forbidden(
        "You do not have permission to cancel this booking.",
      );

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
      AppError.internalError("An error occurred when cancelling the booking."),
    );
  }
};

export {
  createBooking,
  cancelBooking,
  getUsersBookings,
  getSingleBooking,
  updateBookingStatus,
  getAllBookings,
};
