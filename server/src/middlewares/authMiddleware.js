import { verifyToken } from "../utils/jwtUtils.js";
import AppError from "./AppError.js";

/**
 * Authentication middleware - Protects routes
 * Verifies JWT token and attaches user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      throw AppError.unauthorized(
        "Not authorized to access this route. Token missing.",
      );
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware - Role-based access control
 * Checks if user has required role(s)
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      // Check if user exists (should be set by protect middleware)
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }

      // Flatten roles array (handles both authorize('admin') and authorize(['admin']))
      const allowedRoles = roles.flat();

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        throw AppError.forbidden("Not authorized to access this route");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication
 * Attaches user to request if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.id,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};

export { authorize, optionalAuth, protect };
