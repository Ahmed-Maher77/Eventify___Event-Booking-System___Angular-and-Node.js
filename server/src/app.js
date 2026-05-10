import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import dns from "node:dns/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import {
    errorHandler,
    notFoundHandler,
} from "./middlewares/errorMiddleware.js";
import { logger } from "./middlewares/loggerMiddleware.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import { handleStripeWebhook } from "./controllers/checkoutController.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { uploadImage } from "./config/multerConfig.js";
import { uploadImageBuffer } from "./utils/cloudinaryUpload.js";

dns.setServers(["8.8.8.8"]);

const app = express();
// Prefer qs-style parsing (matches Express 4) so repeated keys and nested params behave predictably.
app.set("query parser", "extended");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liveness probe for load balancers and hosts (e.g. Render). No DB or auth — keep fast and stable.
app.get("/healthz", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.status(200).json({ status: "ok", service: "eventify-api" });
});

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        return callback(null, origin);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200,
};

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Eventify API Documentation",
            version: "1.0.0",
            description:
                "API documentation for Eventify - Event Management System: authentication, events and reviews, bookings, Stripe checkout, Cloudinary media, favorites, contact, newsletter, admin modules, and an authenticated database-driven RAG chatbot (MongoDB event retrieval + Groq completions). MongoDB-backed; JWT where applicable.",
            contact: {
                name: "Eventify Team",
            },
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        'JWT token obtained from /api/auth/login endpoint. Format: "Bearer <token>"',
                },
            },
        },
    },
    apis: ["./docs/swagger/**/*.yaml"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Stripe webhook must use the **raw** body for signature verification (before express.json).
app.post(
    "/api/checkout/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook,
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security middleware
app.use(helmet()); // Set security HTTP headers
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(cookieParser());

// Request logging middleware
app.use(logger);

// Rate limiting
app.use("/api", apiLimiter);

// Swagger documentation route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve static files from the files directory
app.use("/files", express.static(path.join(__dirname, "..", "files")));
// Basic route
app.get("/", (req, res) => {
    res.json({
        message: "Eventify API",
        summary:
            "Event discovery, bookings, Stripe, favorites, reviews, contact, newsletter, MongoDB-grounded RAG chatbot (Groq), admin.",
        version: "1.0.0",
        docs: "/api-docs",
    });
});



app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler); // Handle 404 - undefined routes
app.use(errorHandler); // Handle errors

export default app;
