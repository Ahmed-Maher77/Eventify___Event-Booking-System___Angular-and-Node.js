import { Router } from "express";
import {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
} from "../controllers/eventController.js";
import {
    validateCreateEvent,
    validateUpdateEvent,
} from "../utils/validators.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { uploadImage } from "../config/multerConfig.js";


const router = Router();


// ======= Get all events (public) =======
router.get("/", getEvents);


// ======= Get single event (public) =======
router.get("/:id", getEvent);


// ======= Create new event (admin only) =======
router.post(
    "/",
    protect,
    authorize(["admin"]),
    uploadImage.single("image"),
    validateCreateEvent,
    createEvent,
);


// ======= Update event (admin only) =======
router.put(
    "/:id",
    protect,
    authorize(["admin"]),
    uploadImage.single("image"),
    validateUpdateEvent,
    updateEvent,
);


// ======= Delete event (admin only) =======
router.delete("/:id", protect, authorize(["admin"]), deleteEvent);


export default router;
