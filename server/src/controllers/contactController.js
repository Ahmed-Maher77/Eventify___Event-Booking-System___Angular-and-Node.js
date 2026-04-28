import AppError from "../middlewares/AppError.js";
import ContactMessage from "../models/ContactMessage.js";

//        ==> POST <==
// ---- Create Contact Message ----
const createContactMessage = async (req, res, next) => {
  try {
    const { fullName, email, subject, message } = req.body;

    const contactMessage = await ContactMessage.create({
      fullName,
      email,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Contact message submitted successfully.",
      data: contactMessage,
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(
      AppError.internalError(
        "An error occurred while submitting your contact message.",
      ),
    );
  }
};

//        ==> GET <==
// ---- Get Contact Messages [Admin ONLY] ----
const getAllContactMessages = async (req, res, next) => {
  try {
    const { status } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const contactMessages = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMessages = await ContactMessage.countDocuments(filter);
    const totalPages = Math.ceil(totalMessages / limit);

    res.status(200).json({
      success: true,
      message: "Contact messages retrieved successfully.",
      data: {
        messages: contactMessages,
        pagination: {
          currentPage: page,
          totalPages,
          totalMessages,
          limit,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(
      AppError.internalError(
        "An error occurred when retrieving contact messages.",
      ),
    );
  }
};

//              ==> PATCH <==
// ---- Update Contact Message Status [Admin ONLY] ----
const updateContactMessageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const message = await ContactMessage.findById(id);
    if (!message) throw AppError.notFound("Contact message not found.");

    message.status = status;
    await message.save();

    res.status(200).json({
      success: true,
      message: "Contact message status updated successfully.",
      data: message,
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(
      AppError.internalError(
        "An error occurred when updating contact message status.",
      ),
    );
  }
};

//              ==> DELETE <==
// ---- Delete Contact Message [Admin ONLY] ----
const deleteContactMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findById(id);
    if (!message) throw AppError.notFound("Contact message not found.");

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: "Contact message deleted successfully.",
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(
      AppError.internalError(
        "An error occurred when deleting contact message.",
      ),
    );
  }
};

export {
  createContactMessage,
  getAllContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
};
