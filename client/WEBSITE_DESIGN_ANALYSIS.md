# Eventify Client - Current Product Snapshot

This document reflects the **current frontend implementation** (Angular) and highlights what is complete, partial, and still missing.

## Stack and Runtime

- Angular standalone components + route-level lazy loading
- RxJS + signals for state updates
- SCSS design system with reusable shared components
- Backend base URL from `client/.env`:

```env
BACKEND_API=http://localhost:5000/api
```

## Implemented Routes

### Public

- `/`
- `/about`
- `/contact`
- `/faq`
- `/privacy`
- `/terms`
- `/register`
- `/login`
- `/reset-password`
- `/events`
- `/events/:id`

### User Protected

- `/checkout`
- `/bookings/success`
- `/bookings/:id/confirmation`
- `/bookings`
- `/bookings/:id`
- `/profile`
- `/favorites`
- `/profile/orders` (route exists, page is currently placeholder)

### Admin Protected

- `/dashboard`
- `/dashboard/events`
- `/dashboard/events/:id`
- `/dashboard/bookings`
- `/dashboard/users`
- `/dashboard/users/:userId`
- `/dashboard/messages`
- `/dashboard/subscribers`
- `/dashboard/assistant-logs`

## Feature Coverage (Frontend)

### User-facing

- Auth flows (register, login, logout)
- Event catalog with filters/sorting/search
- Event details with booking entry point
- Booking list, booking details, confirmation flows
- Checkout flow with Stripe integration screens
- Favorites page + header/profile favorite count updates
- Profile page:
  - personal info editing
  - password change
  - avatar upload via image picker and backend upload
  - stats cards wired to real bookings/favorites/reviews counts
- AI assistant UI surfaces:
  - floating/chat panel entry
  - dedicated "talk to AI" section

### Admin

- Dashboard KPIs and "Need Attention" section with loading/error/retry states
- Event management list/detail/edit/create
- Booking operations list with:
  - status tabs and counts
  - filter/search/sort/pagination
  - date-aware action logic (refund/cancel vs delete)
  - URL query-param driven filtering
- User management list/detail + actions
- Contact messages management
- Newsletter subscribers management
- Assistant activity logs

## Recent Behavior Fixes

- `View user bookings` now forwards query params correctly through shared button component.
- `Dashboard bookings -> Clear filters` now also clears URL query params.
- Reusable admin state component introduced for list-page loading/error blocks.
- Profile dropdown favorite count is reactive and updates across interactions.

## Known Gaps / Partial Work

1. `profile/orders` page is still a placeholder and not connected to real order/payment history.
2. No dedicated "forgot password request" route UI (only reset route exists).
3. No explicit global "403 unauthorized" page route yet.
4. No end-to-end frontend test suite visible for critical booking/checkout/admin flows.

## Recommended Next Priorities (Client)

1. Implement real `profile/orders` transaction history (paid/refunded/pending timeline).
2. Add forgot-password request + token email flow screens.
3. Add route-level guard UX pages for 401/403 and expired session recovery.
4. Add Playwright/Cypress smoke tests for:
   - checkout payment intent + sync
   - dashboard booking filtered navigation
   - profile avatar upload
   - admin moderation actions
5. Add small "active filters" chips in dashboard lists to improve filter visibility.

---

Last updated: 2026-05-08
