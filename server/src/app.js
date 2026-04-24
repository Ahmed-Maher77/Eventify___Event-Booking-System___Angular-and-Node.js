import cors from "cors";
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
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

dns.setServers(["8.8.8.8"]);

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Eventify API Documentation",
      version: "1.0.0",
      description: "API documentation for Eventify - Event Management System",
      contact: {
        name: "Eventify Team",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet()); // Set security HTTP headers
app.use(cors()); // Enable CORS

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
    message: "Eventify API is running!",
    version: "1.0.0",
    docs: "/api-docs",
  });
});

// API Routes (to be added by other team members)
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler); // Handle 404 - undefined routes
app.use(errorHandler); // Handle errors

export default app;
