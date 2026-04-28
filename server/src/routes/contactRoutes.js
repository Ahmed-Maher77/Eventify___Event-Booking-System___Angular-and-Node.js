import { Router } from "express";
import { createContactMessage } from "../controllers/contactController.js";
import { validateContactMessage } from "../utils/validators.js";

const router = Router();

//             ==> POST <==
// ---- Submit Contact Message ----
router.post("/", validateContactMessage, createContactMessage);

export default router;
