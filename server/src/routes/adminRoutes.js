import { Router } from "express";
import { getAllBookings } from "../controllers/bookingController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, authorize(["admin"]));

//             ==> GET <==
// ---- Get All Bookings [Admin ONLY] ----
router.get("/bookings", getAllBookings);

export default router;
