# Eventify API Specifications (Current)

This is a concise, current-state endpoint map aligned with the existing Express routes.

## Conventions

- Base URL (local): `http://localhost:5000`
- API prefix: `/api`
- Auth: Bearer token and/or auth cookie (depending on client behavior)
- Common response envelope:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

## Authentication (`/api/auth`)

- `POST /register` (supports optional `image` upload)
- `POST /login`
- `POST /logout`
- `PATCH /me` (profile update, supports optional `image` upload)
- `PATCH /me/password`
- `DELETE /me`

## Events (`/api/events`)

- `GET /` public events list (pagination/filter/sort/search)
- `GET /:id` public event details
- `POST /` admin create event (supports image upload)
- `PUT /:id` admin update event (supports image upload)
- `DELETE /:id` admin delete event

### Event Review Subroutes

- `GET /:id/reviews`
- `GET /:id/review-status`
- `POST /:id/reviews`
- `PATCH /:id/reviews/:reviewId`
- `DELETE /:id/reviews/:reviewId`
- `DELETE /:id/reviews/:reviewId/admin-delete` (admin)
- `POST /:id/reviews/:reviewId/vote`

## Favorites (`/api/favorites`) (auth required)

- `GET /` list user's favorites
- `GET /:eventId/status` check if an event is favorited
- `POST /:eventId` add favorite
- `PATCH /:eventId/toggle` toggle favorite
- `DELETE /:eventId` remove favorite

## Bookings (`/api/bookings`) (auth required)

- `GET /` list current user's bookings
- `GET /:id` booking details
- `GET /events/:eventId/active` get active booking for event
- `POST /` create booking
- `PATCH /:id/quantity` update quantity (owner/admin constraints apply)
- `DELETE /:id` cancel booking
- `DELETE /:id/remove` permanently remove cancelled booking

## Checkout (`/api/checkout`) (auth required unless webhook)

- `POST /payment-intent`
- `POST /sync-payment`
- `POST /webhook` (raw Stripe webhook body route in app bootstrap)

## Contact (`/api/contact`)

- `POST /` submit contact message (public)

## Newsletter (`/api/newsletter`)

- `POST /` subscribe or reactivate subscription (public)

## Chat (`/api/chat`) (auth required)

- `POST /completions`

## Admin (`/api/admin`) (admin auth required)

### Dashboard / Analytics

- `GET /dashboard-stats`
- `GET /needs-attention`
- `GET /recent-bookings`
- `GET /assistant-activity`

### Bookings

- `GET /bookings`
- `DELETE /bookings/:id` (date-aware admin operation logic)

### Users

- `GET /users`
- `GET /users/:id`
- `POST /users` (create admin)
- `PATCH /users/:id/role`
- `PATCH /users/:id/status`

### Contact Messages

- `GET /contact-messages`
- `PATCH /contact-messages/:id/status`
- `DELETE /contact-messages/:id`

### Newsletter Subscribers

- `GET /newsletter-subscribers`
- `PATCH /newsletter-subscribers/:id/status`
- `DELETE /newsletter-subscribers/:id`

## Query Behavior Highlights

- Most list endpoints support `page` and `limit`.
- Admin bookings support:
  - `status`
  - `userId`
  - `eventId`
  - `search`
  - `sort`
  - `order`
- Admin users support role/search/sort pagination patterns.
- Contact/newsletter admin lists support status/search/sort pagination patterns.

## Current Notes

1. Profile updates are implemented, but no explicit `GET /api/auth/me` endpoint exists yet.
2. Booking state transitions are rule-driven (not free-form admin status patch).
3. Stripe webhook route is mounted before JSON body parser for signature verification correctness.

---

Last updated: 2026-05-08
