import { Router } from "express";
import { getAllBookings } from "../controllers/bookingController.js";
import { getAllContactMessages } from "../controllers/contactController.js";
import { getAllNewsletterSubscribers } from "../controllers/newsletterController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, authorize(["admin"]));

//             ==> GET <==
// ---- Get All Bookings [Admin ONLY] ----
router.get("/bookings", getAllBookings);
router.get("/contact-messages", getAllContactMessages);
router.get("/newsletter-subscribers", getAllNewsletterSubscribers);

export default router;
