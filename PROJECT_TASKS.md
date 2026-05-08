# Eventify Project Tasks

This document lists the project tasks in a clean delivery format.

## Authentication and Account

- [x] Build user registration endpoint and UI flow
- [x] Build user login endpoint and UI flow
- [x] Build user logout flow
- [x] Protect authenticated routes in frontend and backend
- [x] Implement admin-only route access control
- [x] Implement profile update endpoint and profile page editing
- [x] Implement password update flow from profile page
- [x] Implement profile avatar upload (frontend + backend + storage)
- [ ] Implement current user profile fetch endpoint (`GET /api/auth/me`)
- [ ] Implement full forgot-password request and reset flow

## Events Module

- [x] Build public events listing page and API integration
- [x] Implement event filtering, search, sorting, and pagination
- [x] Build event details page and API integration
- [x] Implement admin create event flow
- [x] Implement admin update event flow
- [x] Implement admin delete event flow
- [x] Implement event image upload and fallback handling

## Bookings Module

- [x] Build booking creation flow
- [x] Build user bookings list page
- [x] Build booking details and confirmation pages
- [x] Implement booking cancellation flow
- [x] Implement booking quantity update logic with validation rules
- [x] Implement admin bookings page (list/search/filter/sort/pagination)
- [x] Implement admin booking operation logic by event date rules
- [x] Implement query-param-based filtering in dashboard bookings page
- [x] Implement clear-filters behavior to reset URL query params
- [ ] Add automated integration tests for booking rule matrix

## Payments and Checkout

- [x] Build checkout page and order summary flow
- [x] Implement payment intent endpoint integration
- [x] Implement payment status sync endpoint integration
- [x] Configure Stripe webhook handling path in server bootstrap
- [ ] Build profile orders/payment history page with real transaction data
- [ ] Add idempotency handling for payment-sensitive operations

## Favorites Module

- [x] Implement favorites endpoints (list/status/add/remove/toggle)
- [x] Build favorites page UI and integration
- [x] Show reactive favorites count in header/profile menu

## Reviews and Ratings

- [x] Implement event reviews listing endpoint usage
- [x] Implement create/update/delete review flows
- [x] Implement review vote flow
- [x] Integrate review and vote interactions in event details page

## Contact and Newsletter

- [x] Build contact form submission flow
- [x] Implement admin contact messages management
- [x] Build newsletter subscription flow
- [x] Implement admin newsletter subscribers management
- [ ] Implement newsletter unsubscribe public flow

## Admin Dashboard and Management

- [x] Build admin dashboard page with KPIs
- [x] Build recent bookings dashboard section
- [x] Build needs-attention dashboard section
- [x] Implement loading/error/retry states for needs-attention section
- [x] Build admin users management page and detail page
- [x] Build admin messages management page
- [x] Build admin subscribers management page
- [x] Build admin assistant activity logs page
- [ ] Add audit logging for destructive admin operations

## AI Assistant

- [x] Implement authenticated chat completion endpoint integration
- [x] Build frontend AI chat panel/widget interactions
- [x] Build assistant logs admin view

## Shared Components and Refactoring

- [x] Extract reusable admin list loading/error state component
- [x] Extract and reuse shared types for large pages/services
- [x] Refactor profile avatar editing into reusable component
- [x] Extend shared button to support router query params

## Documentation and API Collections

- [x] Update client project analysis markdown to match implementation
- [x] Update server project overview markdown to match implementation
- [x] Update API specifications markdown to match current routes
- [x] Update middleware/utilities status markdown
- [x] Update Bruno collection README status
- [ ] Update root README to align with current backend/frontend behavior
- [ ] Expand Bruno collection coverage to include all current endpoints

## Testing and Delivery

- [x] Keep project building after feature and refactor changes
- [ ] Add frontend E2E tests for critical user/admin flows
- [ ] Add backend integration tests for bookings, checkout, and admin operations
- [ ] Add CI pipeline checks for build, lint, and tests
- [ ] Prepare release checklist for deployment readiness

---

Last updated: 2026-05-08
