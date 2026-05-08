# Middleware & Utilities Status (Current)

This replaces the old "team member handoff" note and documents the current middleware/utilities layer in active use.

## Active Middleware

- `AppError.js`
  - standard app error type + helper factories (`badRequest`, `unauthorized`, etc.)
- `errorMiddleware.js`
  - global error formatter
  - 404 not-found handler
- `authMiddleware.js`
  - `protect`
  - `authorize([...roles])`
  - `optionalAuth`
- `loggerMiddleware.js`
  - request logging and user-id-aware tracing
- `rateLimiter.js`
  - global and route-specific limiter definitions
- event field validation middleware under `middlewares/events/*`
- request body validation middleware (`validateRequestBody.js`)

## Active Utilities

- `validators.js`
  - validation chains for auth/events/bookings/admin/contact/newsletter/reviews
- `jwtUtils.js`
  - JWT generation + verification helpers
- `authCookie.js`
  - auth cookie name/options helpers
- `avatarUtils.js`
  - fallback avatar URL generation
- `cloudinaryUpload.js`
  - upload/delete helpers for profile and event images

## Integration Notes

- App bootstrap in `src/app.js` is currently wired with:
  - helmet + cors + cookie parser
  - request logger
  - global API limiter
  - mounted routes
  - final notFound/error handlers
- Stripe webhook endpoint is intentionally mounted before JSON parser.

## Observed Gaps

1. Middleware/docs mention broad coverage, but integration tests for middleware behavior are not documented here.
2. Some endpoint docs in the repository still describe older flows; treat route/controller code as source of truth.
3. No documented strategy yet for audit logging on destructive admin actions.

## Recommended Follow-ups

1. Add middleware-focused tests (auth/authorization/rate-limit/error formatting).
2. Add request-id correlation and structured logs for easier debugging across frontend/backend.
3. Add explicit audit trail utility for admin deletes/status changes.

---

Last updated: 2026-05-08
