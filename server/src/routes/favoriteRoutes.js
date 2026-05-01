import { Router } from "express";
import {
    addFavorite,
    getUserFavorites,
    removeFavorite,
    toggleFavorite,
} from "../controllers/favoriteController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, getUserFavorites);
router.post("/:eventId", protect, addFavorite);
router.patch("/:eventId/toggle", protect, toggleFavorite);
router.delete("/:eventId", protect, removeFavorite);

export default router;
