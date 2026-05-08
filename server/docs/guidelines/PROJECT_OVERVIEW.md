# Eventify Server - Project Overview (Current)

Backend API for Eventify (event discovery, booking, admin operations, favorites, reviews, support channels, and AI assistant logging).

## Core Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT auth (token + cookie support)
- Stripe payment intent + webhook sync
- Cloudinary image upload/delete
- Rate limiting + request logging + centralized error handling
- Swagger/OpenAPI docs at `/api-docs`

## Main API Modules

- `auth`: register/login/logout, profile updates, password updates, delete account
- `events`: public listing/detail + admin CRUD
- `event reviews`: create/update/delete reviews and vote on helpfulness
- `bookings`: create/list/detail/update quantity/cancel/delete-cancelled
- `checkout`: payment intent creation + payment status sync + webhook handling
- `favorites`: add/remove/toggle favorites and status checks
- `contact`: public support message submission + admin moderation
- `newsletter`: subscribe endpoint + admin moderation
- `admin`: dashboard stats, needs-attention, bookings/users/messages/subscribers/assistant logs
- `chat`: authenticated AI completion endpoint

## Current Route Mounts

- `/api/auth`
- `/api/events`
- `/api/favorites`
- `/api/bookings`
- `/api/checkout`
- `/api/contact`
- `/api/newsletter`
- `/api/chat`
- `/api/admin`

## Implemented Operational Features

- Pagination, search, filtering, and sorting on major list endpoints
- Role-based access control (`user` / `admin`)
- Event image and profile image upload support
- Booking safety rules:
  - no booking for past events
  - no overbooking seats
  - duplicate active booking protection
  - cancellation cutoff window enforcement
  - seat restoration on cancellation paths
- Admin booking operation logic:
  - refund + cancel behavior before event date for eligible paid bookings
  - delete-only fallback behavior in non-refundable paths
- Dashboard analytics:
  - dashboard stats
  - recent bookings
  - needs-attention summary
- AI assistant activity collection and admin review endpoint

## Known Gaps / Technical Debt

1. No public endpoint to read "current user profile" (`GET /api/auth/me`) despite profile updates existing.
2. Newsletter and contact currently expose public create routes but no public unsubscribe/resolve workflows.
3. Test automation coverage is not documented as complete for critical booking/payment/admin paths.
4. Some historical docs/spec examples still reference older booking status-edit flow semantics.

## Recommended Next Backend Priorities

1. Add `GET /api/auth/me` to simplify client bootstrap/session refresh.
2. Add password reset request/confirm endpoints (email token flow).
3. Add idempotency keys for payment-related mutations.
4. Add integration tests for:
   - booking cancel/refund decision matrix
   - admin delete-by-event-date behavior
   - checkout payment-intent + sync + webhook lifecycle
5. Add structured audit logging for admin destructive actions.

---

Last updated: 2026-05-08
