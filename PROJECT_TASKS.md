# Eventify — technical delivery tracker

This document is the **single delivery-oriented view** of the Eventify platform: what is **already shipped** in the current codebase versus what is **scheduled as follow-on work**. It is aimed at **technical contributors**—engineers, reviewers, and technical leads—and stays aligned with the repository README, API docs, and system operations notes.

**How to read status**

- **[x] Complete** — Implemented and reflected in the current application or API unless a release branch states otherwise.
- **[ ] Planned** — Backlog item for a future iteration; absence of a checkmark is **not** a judgment on the quality of what is already live.

**System scope**

Angular client, Node.js / Express API, MongoDB persistence, and integrations: Stripe, Cloudinary, and the optional AI assistant channel.

---

## Identity, access, and profiles

- [x] User self-service registration (API and web)
- [x] Secure sign-in and sign-out (API and web)
- [x] Protected customer and administrator routes (client and server)
- [x] Role-based administration (admin-only capabilities)
- [x] Profile updates and password change from the account area
- [x] Profile image upload with secure storage integration
- [ ] Session bootstrap: authenticated user profile retrieval API (e.g. `GET /api/auth/me`) for streamlined client startup
- [ ] Self-service password recovery (request and reset), end-to-end

---

## Events discovery and administration

- [x] Public events catalog with API-backed content
- [x] Search, filters, sort order, and paginated results
- [x] Event detail page (content, booking entry, and related modules)
- [x] Administrator create, edit, and retire events
- [x] Event imagery: upload, external URL, and sensible default artwork

---

## Reservations and bookings

- [x] End-user booking path from discovery to confirmation
- [x] Bookings list and detail for the signed-in customer
- [x] Cancellation aligned with server-side domain rules
- [x] Quantity changes with server-side validation
- [x] Administrator bookings workspace (search, filter, sort, pagination)
- [x] Administrator actions respecting event date and payment context
- [x] Dashboard bookings views synchronized with URL parameters for shareable filtered states
- [x] Clear-filters behavior restoring default list context
- [ ] Expanded automated test coverage for booking and refund decision scenarios

---

## Payments and checkout

- [x] Checkout and order summary experience
- [x] Payment intent creation and client integration
- [x] Payment status synchronization with the server
- [x] Stripe webhook endpoint configured in the application bootstrap
- [ ] Customer order and payment history in the profile area (live transaction data)
- [ ] Idempotent handling for payment-related operations to support retries safely

---

## Engagement: favorites and social proof

- [x] Favorites service (list, status, add, remove, toggle)
- [x] Favorites page and navigation affordances
- [x] Favorites count surfaced in header and account menu

---

## Reviews and ratings

- [x] Reviews surfaced on event detail
- [x] Create, update, and remove own reviews
- [x] Helpfulness voting on reviews
- [x] Event detail integration for review and vote actions

---

## Contact, subscriptions, and trust

- [x] Contact form for inbound inquiries
- [x] Administrator handling of contact messages
- [x] Newsletter subscription capture
- [x] Administrator visibility into subscribers
- [ ] Public newsletter unsubscribe flow (API and UI)

---

## Administration, reporting, and oversight

- [x] Administrator dashboard with KPI summaries
- [x] Recent bookings snapshot on the dashboard
- [x] “Needs attention” operational queue with resilient loading and retry behavior
- [x] User directory and user detail for administrators
- [x] Message and subscriber administration
- [x] AI assistant activity review for administrators
- [ ] Audit trail for high-impact administrative actions

---

## AI-assisted support

- [x] Authenticated chat completion API with **database-driven RAG**: retrieve upcoming **Event** records from MongoDB (`knowledgeBaseService`), inject formatted context into the system prompt, complete with **Groq** via OpenAI-compatible SDK (`aiChatProvider`)
- [x] In-product AI chat entry points (web) wired to completions
- [x] Administrator review of assistant activity (`AssistantActivity` logging, including retrieval counts)

---

## User experience consistency

- [x] Reusable patterns for administrator list loading and error recovery
- [x] Shared typing and structure for large pages and services
- [x] Reusable profile avatar editing experience
- [x] Navigation controls supporting query-parameter-driven admin views

---

## Documentation and API tooling

- [x] Frontend product snapshot documentation (routes and coverage)
- [x] Backend project overview aligned to implementation
- [x] API specification documentation aligned to routes
- [x] Middleware and utilities status documentation
- [x] Bruno collection documentation (scope and usage)
- [x] Root README aligned to full-stack setup and documentation map
- [ ] Bruno collection extended to full endpoint parity for regression testing

---

## Quality assurance and release readiness

- [x] Continuous compatibility of client and server builds with ongoing delivery
- [ ] End-to-end web tests for high-value customer and administrator journeys
- [ ] Additional server integration tests for bookings, checkout, and administration
- [ ] Continuous integration: build, static analysis, and automated tests
- [ ] Formal release and deployment readiness checklist

---

*Last reviewed: 2026-05-10*
