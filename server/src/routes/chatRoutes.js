import express from "express";
import { getChatCompletion } from "../controllers/chatController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Apply rate limiting specifically for chat if needed, or use the global one
// We'll use the global apiLimiter already applied in app.js, 
// but we can add a more restrictive one here if desired.

router.post("/completions", protect, getChatCompletion);

export default router;
