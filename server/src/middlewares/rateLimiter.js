import rateLimit from "express-rate-limit";

/**
 * Rate limiting — protects the API from abuse.
 * Development uses higher caps; override via .env (see .env.example).
 */

const isProduction = process.env.NODE_ENV === "production";
const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === "true";

function resolveMax(envKey, prodDefault, devDefault) {
  const raw = process.env[envKey];
  if (raw !== undefined && raw !== "") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return isProduction ? prodDefault : devDefault;
}

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    skip: () => rateLimitDisabled,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ success: false, message });
    },
  });
}

// General API: 100 / 15 min (prod) — 2000 / 15 min (dev)
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: resolveMax("RATE_LIMIT_API_MAX", 100, 2000),
  message: "Too many requests from this IP, please try again later.",
});

// Auth routes: 20 / hour (prod) — 200 / hour (dev)
const authLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: resolveMax("RATE_LIMIT_AUTH_MAX", 20, 200),
  message: "Too many authentication attempts, please try again later.",
});

const bookingLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: resolveMax("RATE_LIMIT_BOOKING_MAX", 20, 200),
  message: "Too many booking requests, please try again later.",
});

const adminLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: resolveMax("RATE_LIMIT_ADMIN_MAX", 200, 2000),
  message: "Too many requests, please try again later.",
});

const createRouteLimiter = (max, windowMs = 15 * 60 * 1000, message = null) => {
  return createLimiter({
    windowMs,
    max,
    message: message || "Too many requests, please try again later.",
  });
};

export {
  apiLimiter,
  authLimiter,
  bookingLimiter,
  adminLimiter,
  createRouteLimiter,
};
