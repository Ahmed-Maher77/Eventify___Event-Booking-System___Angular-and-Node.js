# Middleware & Utilities - Member 4

This document describes the middleware and utilities implemented for the Eventify API.

## 📁 Files Created

### Middlewares (`src/middlewares/`)

1. **AppError.js** - Custom error class
2. **errorMiddleware.js** - Error handling and 404 handler
3. **authMiddleware.js** - Authentication and authorization
4. **loggerMiddleware.js** - Request logging (using morgan)
5. **rateLimiter.js** - Rate limiting configuration

### Utilities (`src/utils/`)

1. **jwtUtils.js** - JWT token generation and verification
2. **validators.js** - Input validation helpers

---

## 🔧 Middleware Components

### 1. AppError.js

Custom error class that extends the native Error class with additional properties for consistent error handling.

**Features:**
- Custom error with status code
- Static factory methods for common HTTP errors:
  - `AppError.badRequest(message)` - 400
  - `AppError.unauthorized(message)` - 401
  - `AppError.forbidden(message)` - 403
  - `AppError.notFound(message)` - 404
  - `AppError.conflict(message)` - 409
  - `AppError.internalError(message)` - 500

**Usage:**
```javascript
import AppError from './middlewares/AppError.js';

throw AppError.notFound('User not found');
```

---

### 2. errorMiddleware.js

Centralized error handling middleware that catches and formats all errors.

**Features:**
- Handles Mongoose errors (CastError, ValidationError, Duplicate)
- Handles JWT errors (JsonWebTokenError, TokenExpiredError)
- Handles operational errors (AppError instances)
- Hides sensitive error details in production
- 404 handler for undefined routes

**Exports:**
- `errorHandler` - Main error handling middleware
- `notFoundHandler` - 404 handler for undefined routes

**Usage in app.js:**
```javascript
// Must be placed AFTER all routes
app.use(notFoundHandler); // Handle 404
app.use(errorHandler); // Handle errors
```

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

---

### 3. authMiddleware.js

Authentication and authorization middleware for protecting routes.

**Features:**
- JWT token verification
- Attaches user info to request object
- Role-based access control

**Exports:**
- `protect` - Requires authentication
- `authorize(...roles)` - Requires specific role(s)
- `optionalAuth` - Optional authentication (doesn't require token)

**Usage:**
```javascript
import { protect, authorize } from './middlewares/authMiddleware.js';

// Protected route (requires authentication)
router.get('/profile', protect, controller.getProfile);

// Admin-only route
router.get('/admin/users', protect, authorize('admin'), controller.getAllUsers);

// Optional auth (user info attached if token present)
router.get('/events', optionalAuth, controller.getEvents);
```

---

### 4. loggerMiddleware.js

HTTP request logging using morgan with custom tokens and file logging.

**Features:**
- Console logging (development/production format)
- File logging to `src/logs/access.log`
- Custom tokens for response time and user ID
- Manual logging helper function

**Exports:**
- `logger` - Combined console and file logger
- `logRequest(message, req)` - Manual logging helper

**Usage:**
```javascript
import { logger } from './middlewares/loggerMiddleware.js';

// In app.js (early in the middleware chain)
app.use(logger);

// Manual logging in controllers
import { logRequest } from './middlewares/loggerMiddleware.js';
logRequest('User created', req);
```

**Log Format (Development):**
```
GET /api/events 200 45.23 ms - 1234 anonymous
```

**Log Format (File):**
```
2026-04-09T10:30:00.000Z | GET /api/events | 200 | 45.23 ms | anonymous | 1234 bytes
```

---

### 5. rateLimiter.js

Rate limiting configuration to prevent API abuse.

**Features:**
- Different rate limits for different endpoint types
- Configurable window and max requests
- Custom error messages

**Exports:**
- `apiLimiter` - General API rate limit (100 req/15min)
- `authLimiter` - Authentication endpoints (10 req/hour)
- `bookingLimiter` - Booking endpoints (20 req/15min)
- `adminLimiter` - Admin endpoints (200 req/15min)
- `createRouteLimiter(max, windowMs, message)` - Custom rate limiter

**Usage:**
```javascript
import { authLimiter, apiLimiter } from './middlewares/rateLimiter.js';

// Apply to routes
router.post('/login', authLimiter, authController.login);

// General API limiting (in app.js)
app.use('/api', apiLimiter);
```

---

## 🛠️ Utility Functions

### 1. jwtUtils.js

JWT token generation and verification utilities.

**Functions:**
- `generateToken(userId, userRole)` - Generate JWT token
- `verifyToken(token)` - Verify and decode token (throws error if invalid)
- `decodeToken(token)` - Decode token without verification

**Usage:**
```javascript
import { generateToken, verifyToken } from './utils/jwtUtils.js';

// Generate token (e.g., after login)
const token = generateToken(user._id, user.role);

// Verify token
try {
  const decoded = verifyToken(token);
  console.log(decoded.id, decoded.role);
} catch (error) {
  // Handle invalid token
}
```

---

### 2. validators.js

Input validation and sanitization using express-validator.

**Validation Chains:**
- `validateRegistration` - User registration validation
- `validateLogin` - User login validation
- `validateEvent` - Event creation/update validation
- `validateBooking` - Booking creation validation
- `validateObjectId(paramName)` - MongoDB ObjectId validation
- `validateQuery` - Pagination and query parameters validation

**Helper Functions:**
- `handleValidationErrors` - Process validation results
- `sanitizeString(str)` - Remove HTML tags
- `isValidEmail(email)` - Email format validation

**Usage:**
```javascript
import { validateRegistration, validateEvent, validateObjectId } from './utils/validators.js';

// Registration route
router.post('/register', validateRegistration, authController.register);

// Event routes
router.post('/events', validateEvent, eventController.create);
router.get('/events/:id', ...validateObjectId('id'), eventController.getById);
```

**Validation Rules:**

**Registration:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email, normalized
- `password`: Required, min 6 chars, must contain uppercase, lowercase, and number

**Event:**
- `title`: Required, 3-100 characters
- `description`: Required, 10-1000 characters
- `date`: Required, valid ISO date, must be in future
- `location`: Required, 3-200 characters
- `category`: Required, one of: concert, conference, workshop, seminar, sports, other
- `capacity`: Required, positive integer
- `price`: Required, non-negative number

**Booking:**
- `eventId`: Required, valid MongoDB ObjectId
- `quantity`: Required, positive integer

---

## 📋 Integration in app.js

All middleware is integrated in `app.js` in the following order:

```javascript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './middlewares/loggerMiddleware.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';

const app = express();

// 1. Security middleware
app.use(helmet());
app.use(cors());

// 2. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Request logging
app.use(logger);

// 4. Rate limiting
app.use('/api', apiLimiter);

// 5. Routes (to be added by other members)
// app.use('/api/auth', authRoutes);
// app.use('/api/events', eventRoutes);
// app.use('/api/bookings', bookingRoutes);

// 6. Error handling (MUST BE LAST)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

---

## 🔒 Security Features

1. **Helmet** - Sets security HTTP headers
2. **CORS** - Cross-Origin Resource Sharing
3. **Rate Limiting** - Prevents API abuse
4. **Input Validation** - Sanitizes and validates all inputs
5. **JWT Authentication** - Secure token-based auth
6. **Error Handling** - Doesn't expose sensitive data

---

## 📝 Environment Variables

Required environment variables (see `.env.example`):

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/eventify
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

---

## ✅ Completed Tasks

- ✅ Custom error class (AppError)
- ✅ Error handling middleware
- ✅ 404 handler for undefined routes
- ✅ Authentication middleware (protect routes)
- ✅ Authorization middleware (role-based access)
- ✅ Optional authentication middleware
- ✅ Request logger (console + file)
- ✅ Rate limiting (general, auth, booking, admin)
- ✅ JWT utilities (generate, verify, decode)
- ✅ Validation utilities (registration, login, events, bookings)
- ✅ Integration in app.js
- ✅ Security middleware (helmet, cors)
- ✅ .env.example file

---

## 🔄 Dependencies for Other Team Members

**Member 1 (Authentication & Authorization) needs to:**
- Create `controllers/authController.js` with register and login functions
- Create `routes/authRoutes.js` and use the validation middleware
- Use `generateToken()` from `utils/jwtUtils.js`
- Apply `validateRegistration` and `validateLogin` validators

**Member 2 (Event Management) needs to:**
- Create `controllers/eventController.js` with CRUD operations
- Create `routes/eventRoutes.js`
- Use `protect` and `authorize('admin')` for admin routes
- Apply `validateEvent` validator
- Use `validateQuery` for pagination/filtering/sorting

**Member 3 (Booking Management) needs to:**
- Create `controllers/bookingController.js` with booking operations
- Create `routes/bookingRoutes.js`
- Use `protect` for all booking routes
- Apply `validateBooking` validator
- Use `validateObjectId` for route parameters

**Member 5 (API Documentation & Integration) needs to:**
- Use the existing middleware structure
- Add Swagger documentation
- Test all endpoints
- Update README with API documentation

---

## 📦 Additional Packages Installed

- `helmet` - Security headers
- `cors` - Cross-origin resource sharing

---

## 🚀 Ready to Use

All middleware and utilities are ready for integration. Other team members can:

1. Import the middleware they need
2. Apply validation chains to their routes
3. Use `protect` and `authorize` for route protection
4. Use JWT utilities for token generation
5. Focus on business logic in controllers

The middleware handles:
- Error handling and formatting
- Authentication and authorization
- Request logging
- Rate limiting
- Input validation
- Security headers

---

*Last Updated: April 9, 2026*
