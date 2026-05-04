import { Router } from "express";
import { createNewsletterSubscription } from "../controllers/newsletterController.js";
import { validateNewsletterSubscription } from "../utils/validators.js";

const router = Router();

//             ==> POST <==
// ---- Subscribe to Newsletter ----
router.post("/", validateNewsletterSubscription, createNewsletterSubscription);

export default router;
