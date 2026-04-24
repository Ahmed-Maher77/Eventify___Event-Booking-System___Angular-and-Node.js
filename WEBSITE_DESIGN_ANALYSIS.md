# Eventify — Website Design Analysis

This document describes a **real-world, production-oriented** information architecture and UX blueprint for Eventify: an event discovery, ticket booking, and administration product aligned with the existing REST API (auth, events, bookings, admin). It also reserves clear touchpoints for **payments** and an **AI chatbot** you plan to add later.

**Product summary:** Users discover events, check availability and pricing, book seats, and manage their reservations. Admins create and maintain events and oversee bookings across the platform.

---

## 1. Design goals

- **Trust:** Clear pricing, capacity, cancellation policy, and booking status at every step.
- **Speed:** Few taps from discovery to confirmation; strong search and filters on the catalog.
- **Clarity:** Distinct experiences for **guest**, **signed-in user**, and **admin** without dead ends.
- **Extensibility:** Checkout and support flows designed so **payment** and **AI assistance** slot in without restructuring primary journeys.

---

## 2. Roles and primary audiences

| Role | Goals |
|------|--------|
| **Guest** | Browse events, compare options, register or log in to book. |
| **User** | Book tickets, pay (when integrated), view and cancel bookings, get help via chatbot. |
| **Admin** | CRUD events, monitor capacity and revenue signals, change booking statuses, resolve issues. |

---

## 3. Page inventory and detailed content

Below, each page lists **purpose**, **primary information**, **actions**, and **API alignment** (mapping to current backend concepts: `Event` fields, `Booking`, `User` roles).

### 3.1 Global shell (layout present on most pages)

**Purpose:** Persistent navigation, account access, and global utilities.

**Content / components:**

- **Header:** Logo (Eventify), primary nav (Events, How it works, For organizers optional), **Search** shortcut, **Sign in / Register** or **Account menu** (Dashboard, My bookings, Settings, Admin panel if role is admin), **Cart or booking summary** icon (optional if multi-step checkout).
- **Footer:** Company links (About, Contact, Privacy, Terms), social links, newsletter optional, language/currency placeholders (useful before international payments).
- **System:** Toast notifications, loading states, error boundaries, **AI chatbot launcher** (fixed button or header entry) — see §6.
- **Trust strip (homepage and checkout):** Security badges, refund/cancellation summary link.

**States:** Logged out vs logged in nav; admin-only links only when `role === admin`.

---

### 3.2 Marketing and trust

#### **Home (`/`)**

**Purpose:** Value proposition, discovery entry, and conversion to browse or sign up.

**Content:**

- **Hero:** Headline, subcopy, primary CTA “Browse events”, secondary “Create account” / “Sign in”.
- **Featured events:** Curated or algorithmically “soon / popular” cards (image, title, date, location snippet, price from, category badge, availability hint).
- **Category shortcuts:** Concert, Conference, Workshop, Seminar, Sports, Other — aligned with API `category` enum.
- **How it works:** 3–4 steps (Find event → Select seats → Confirm booking → Receive confirmation); later: “Pay securely” as a step when payment goes live.
- **Social proof:** Testimonials, partner logos, or “events hosted” counter (can start minimal).
- **Footer CTA:** Newsletter or “List your event” if B2B expands later.

**Data:** `GET /api/events` with filters (upcoming, sort, limit).

---

#### **How it works (`/how-it-works`)**

**Purpose:** Reduce support load; explain booking states and refunds at a high level.

**Content:**

- Booking lifecycle in plain language: **pending → confirmed → cancelled** (matches API).
- What happens when an event is **cancelled** or **completed** at API `Event.status` level.
- Link to **FAQ** and **Contact**.

---

#### **About (`/about`)** *(optional but “real-world”)*

**Purpose:** Brand story, team or mission, press kit link.

---

#### **Contact (`/contact`)**

**Purpose:** Support channel; later can mention “Instant answers via AI assistant.”

**Content:** Form (name, email, subject, message), expected response time, business address if applicable.

---

#### **FAQ (`/faq`)**

**Purpose:** Self-service: passwords, booking limits, cancellations, payment methods (stub section until payment ships).

---

#### **Legal: Privacy (`/privacy`) & Terms (`/terms`)**

**Purpose:** GDPR-friendly baseline; terms updated when payments and chatbot data retention are defined.

---

### 3.3 Authentication

#### **Register (`/register`)**

**Purpose:** Create `user` with default role `user`.

**Content / fields:** Name, email, password (with strength hint matching API rules), accept terms checkbox, link to login.

**Post-success:** Email verification *if* you add it later; for now redirect to **email confirmation message** or straight to **Events** or intended **return URL**.

---

#### **Login (`/login`)**

**Purpose:** JWT session for protected routes.

**Content:** Email, password, “Forgot password” (placeholder or full flow if implemented), link to register.

**Post-success:** Redirect to `returnUrl` query param or **My bookings** / **Home**.

---

#### **Forgot password / Reset (`/forgot-password`, `/reset-password`)** *(recommended for production)*

**Purpose:** Account recovery — may require new API endpoints; document as future parity with design.

---

### 3.4 Event discovery and detail

#### **Events catalog (`/events`)**

**Purpose:** Primary discovery surface with **pagination, filtering, search, sorting** (as API supports).

**Content:**

- **Toolbar:** Search by title/location/description keyword; filters: **category**, **date range**, **price range**, **location** text; sort: date, price, relevance.
- **Results grid/list:** Card per event: cover image (future asset), title, date/time (localized), location, category chip, **price** (single tier for now), **available seats** or “Sold out” / “Low availability” threshold, **status** badge (upcoming vs others; hide or de-emphasize completed/cancelled per product rule).
- **Empty state:** Adjust filters CTA.
- **SEO:** Meta title/description per filter combination where feasible.

**Data:** `GET /api/events` with query params.

---

#### **Event detail (`/events/:id`)**

**Purpose:** Decision page before booking; answer “what, when, where, how much, how many left.”

**Content:**

- **Hero media:** Image/video placeholder.
- **Title, full description** (`description`).
- **Key facts row:** Date & time, **location**, **category**, **capacity** vs **available seats**, **price per seat** (currency formatted).
- **Organizer / admin note:** Optional “Created by” is usually hidden from public; instead show “Presented by Eventify” or partner name if you extend the model.
- **Status messaging:** If `cancelled` or `completed`, disable booking with clear explanation.
- **Booking module (sidebar or sticky bottom on mobile):** Quantity stepper (min 1, max `availableSeats`), live **subtotal** (`quantity × price`), primary CTA “Book now” → requires auth → **Checkout / Booking confirmation** flow.
- **Share:** Social share, copy link.
- **Related events:** Same category or same city heuristic.

**Data:** `GET /api/events/:id`.

---

### 3.5 Booking and post-booking (user)

#### **Checkout / Confirm booking (`/checkout` or modal from event detail)**

**Purpose:** Finalize `POST /api/bookings` with `eventId`, `quantity`, derived `totalPrice` (client-calculated for display; server remains source of truth).

**Content:**

- **Order summary:** Event title, date, location, seat count, line price, **total**.
- **Attendee / billing placeholders:** For future invoices; optional name-on-ticket.
- **Terms:** Checkbox acknowledging cancellation policy.
- **Payment block (future):** Provider widget (Stripe, PayPal, etc.), card fields or redirect, **pay button**, processing and failure states. Until live, show “Payment coming soon” with **confirm booking** for MVP if product allows unpaid holds — or gate booking until payment exists (product choice).
- **Primary action:** Confirm / Pay — success → confirmation screen.

**Data:** `POST /api/bookings`; later `POST` payment intent + webhook confirmation before setting booking to `confirmed` if you tighten the workflow.

---

#### **Booking confirmation (`/bookings/success` or `/bookings/:id/confirmation`)**

**Purpose:** Reassurance and reference after success.

**Content:** Booking id, event summary, quantity, total paid or total due, **status** (`pending`/`confirmed`), **next steps** (calendar add .ics optional), link to **My bookings**, print-friendly view.

---

#### **My bookings (`/bookings`)**

**Purpose:** List authenticated user’s bookings.

**Content:**

- **Table or cards:** Event name (link), date, quantity, **totalPrice**, **status** badge, booked-at timestamp.
- **Row actions:** View detail, **Cancel** (if allowed by rules), **Pay balance** when payment exists for `pending`.
- **Filters:** By status, upcoming vs past events (join event date client-side or extend API).

**Data:** `GET /api/bookings`.

---

#### **Booking detail (`/bookings/:id`)**

**Purpose:** Single booking record and actions.

**Content:** Full event snapshot or live link to event (if event still public), booking metadata, status timeline (pending → confirmed), cancel button with modal confirmation → `DELETE /api/bookings/:id`.

**Data:** `GET /api/bookings/:id`.

---

### 3.6 User account

#### **Account / Profile settings (`/account`)**

**Purpose:** View/update **name**, **email** (read-only until verification flow exists), change password.

**Note:** Extend API if profile `PATCH` is not present; design assumes production parity.

---

#### **Notifications settings (`/account/notifications`)** *(optional)*

**Purpose:** Email/SMS for booking confirmations and event changes — future feature.

---

### 3.7 Admin area (role-gated)

**Base path suggestion:** `/admin` with layout distinct from consumer UI (sidebar nav).

#### **Admin dashboard (`/admin`)**

**Purpose:** Operational snapshot.

**Content:** Counts — upcoming events, total bookings, **pending** bookings needing action, low-stock events (available seats below threshold). Quick links to **Events** and **All bookings**.

**Data:** Compose from `GET /api/events`, `GET /api/admin/bookings` (aggregate client-side or add dedicated analytics endpoint later).

---

#### **Admin — Events list (`/admin/events`)**

**Purpose:** Manage catalog.

**Content:** Searchable table: title, date, category, capacity, available seats, price, status, actions (Edit, Delete with confirm).

**Data:** `GET /api/events`.

---

#### **Admin — Create event (`/admin/events/new`)**

**Purpose:** `POST /api/events`.

**Content:** Form fields matching **Event** model: title, description (rich text optional), date/time picker, location, category select, capacity, price, initial **status** (default upcoming). Validation messages aligned with API. On submit success → detail or list.

---

#### **Admin — Edit event (`/admin/events/:id/edit`)**

**Purpose:** `PUT /api/events/:id`.

**Content:** Same as create, pre-filled; warn if lowering capacity below already-sold implied seats (business rule; may need API validation).

---

#### **Admin — All bookings (`/admin/bookings`)**

**Purpose:** `GET /api/admin/bookings`.

**Content:** Table: booking id, user email/name (if populated from populate), event title, quantity, totalPrice, status, createdAt. Filters: status, event, date range. Row action: **Update status** → `PATCH /api/bookings/:id` (admin only).

---

#### **Admin — Booking detail (`/admin/bookings/:id`)**

**Purpose:** Audit and support single booking; same PATCH affordance.

---

### 3.8 Error and system pages

| Route | Content |
|-------|---------|
| **`/404`** | Friendly copy, search, link home. |
| **`/403`** | Not authorized; sign in or go back. |
| **`/500`** | Generic failure; retry. |
| **`/maintenance`** | Optional scheduled downtime. |

---

### 3.9 Future-first surfaces (payment + AI)

#### **Payment-related (integrated into flows above)**

- **Checkout:** Payment method selection, 3DS / SCA messaging, receipt.
- **Billing history (`/account/orders` or `/account/payments`):** Transactions, invoices, refund status — requires new backend entities.
- **Webhook-driven UI updates:** Booking moves to **confirmed** after successful payment.

#### **AI chatbot**

- **Global widget:** Context-aware help on **event pages** (policies, accessibility), **checkout** (payment errors), **my bookings** (status meanings).
- **Dedicated “Help” mode:** Optional full-page `/support` with chat + FAQ tabs.
- **Admin assist (optional):** Summarize today’s pending bookings or draft reply templates — keep permissions strict.

---

## 4. Site map

Hierarchical view of routes. Pages marked **[admin]** require `admin` role. **[auth]** requires signed-in user.

```text
/
├── how-it-works
├── about                    (optional)
├── contact
├── faq
├── privacy
├── terms
├── login
├── register
├── forgot-password          (optional)
├── reset-password           (optional)
├── events
│   └── :eventId
├── checkout                 [auth] (or modal)
├── bookings                 [auth]
│   ├── success              [auth]
│   └── :bookingId           [auth]
├── account                  [auth]
│   ├── notifications        [auth] (optional)
│   └── orders               [auth] (future, payment)
├── admin                    [admin]
│   ├── events
│   │   ├── new              [admin]
│   │   └── :eventId/edit    [admin]
│   └── bookings
│       └── :bookingId       [admin]
├── support                  (optional; chat + FAQ)
├── 403
├── 404
└── 500
```

---

## 5. User flows

### 5.1 Guest → first booking (MVP without payment)

**Step-by-step flow:**

1. The guest lands on **Home** or directly on **Events**.
2. They use search/filters (category, date, location, price) to narrow results.
3. They open an **Event detail** page and review date, venue, seats left, and price.
4. They choose ticket quantity and click **Book now**.
5. Because booking is protected, the system redirects them to **Login** or **Register**.
6. After successful authentication, the system sends them back to checkout with the selected event and quantity preserved.
7. The user reviews order summary (event, quantity, total) and confirms booking.
8. The frontend calls `POST /api/bookings`.
9. On success, the user sees a **Booking confirmation** page with booking status and next steps.
10. The user can open **My bookings** to see and manage the new booking.

---

### 5.2 Registered user → view or cancel booking

**Step-by-step flow:**

1. The user opens the account menu and enters **My bookings**.
2. They view a list of bookings with key info (event, quantity, total, status, booking date).
3. The user selects one of two actions:
   - **View booking details** to see full information.
   - **Cancel booking** if cancellation rules allow.
4. If the user chooses cancel, a confirmation modal explains consequences (status change, refund policy when payment exists).
5. After confirmation, the frontend calls `DELETE /api/bookings/:id`.
6. On success, the booking status updates in the list and detail view.

**Rules to show in UI:** Whether `confirmed` bookings are cancelable, cancellation cutoff window before event date, and refund behavior once payments are integrated.

---

### 5.3 Admin → create event and see bookings

**Step-by-step flow:**

1. Admin signs in and enters the **Admin dashboard**.
2. Admin navigates to **Admin events** and clicks **Create new event**.
3. Admin fills event form fields (title, description, date, location, category, capacity, price, status).
4. Frontend submits to `POST /api/events`.
5. On success, admin is redirected to **Admin events list** and sees the new event.
6. Admin then opens **Admin bookings** to monitor platform bookings.
7. Admin selects a booking and updates status when required.
8. Frontend calls `PATCH /api/bookings/:id` and refreshes booking data.

---

### 5.4 Future: Guest/User with **payment** at checkout

**Step-by-step flow:**

1. The authenticated user reaches **Checkout** and reviews booking summary.
2. User chooses payment method and clicks **Pay now**.
3. Backend creates a payment intent/session and returns provider data.
4. User completes payment in hosted provider UI (card/redirect/3DS flow).
5. If payment succeeds, provider sends webhook to backend for verification.
6. Backend updates booking/payment status (for example to `confirmed`).
7. Frontend shows **Confirmation + receipt** and allows access from account history.
8. If payment fails, the user sees actionable errors and can retry or change method.

**Design notes:** Always display total, currency, and fees/taxes (if any); include loading states during 3DS; never store raw card data on your server when hosted fields are used.

---

### 5.5 Future: **AI chatbot** assistance (parallel to human support)

**Step-by-step flow:**

1. User opens the chatbot widget from any page.
2. User asks a question (event details, booking status meaning, policy, checkout help).
3. Assistant checks whether the answer can be safely provided from approved sources (FAQ, policy pages, current event context).
4. If answer is safe and grounded, chatbot returns response with relevant links.
5. If question is sensitive, unclear, or requires manual verification, chatbot offers handoff to **Contact support**.
6. On checkout pages, chatbot provides explanations only and cannot alter prices, terms, or legal text.

**Design notes:** Clearly disclose this is AI support, link to data-retention/privacy policy, and keep escalation to human support visible.

---

## 6. Cross-cutting UX and content checklist

- **Accessibility:** Keyboard path for booking, focus order on modals, WCAG AA contrast on primary buttons.
- **Performance:** Skeleton loaders for event grids; optimistic UI only where rollback is safe.
- **Internationalization:** Date/time and currency formatting hooks even if v1 is single-locale.
- **Security:** JWT in memory or httpOnly cookie strategy; XSS-safe rendering of descriptions.
- **Analytics (optional):** Funnel steps — view event → start checkout → complete booking.

---

## 7. Traceability to current API

| UI area | Endpoints |
|---------|-----------|
| Catalog & detail | `GET /api/events`, `GET /api/events/:id` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| User bookings | `GET/POST /api/bookings`, `GET/DELETE /api/bookings/:id` |
| Admin | `POST/PUT/DELETE /api/events`, `GET /api/admin/bookings`, `PATCH /api/bookings/:id` |

When **payment** and **chatbot** ship, extend this table with payment intents, webhooks, and a dedicated support/AI policy endpoint if needed.

---

## 8. Suggested implementation order (frontend)

1. **Public shell** + **Events** + **Event detail** (read-only).
2. **Auth** pages + protected route wrapper.
3. **Checkout** + **My bookings** + **Booking detail** + cancel.
4. **Admin** layout + events CRUD + bookings list + status PATCH.
5. **Payment** integration at checkout + account orders.
6. **AI chatbot** widget + grounding content (FAQ, event copy).

---

*Document version: 1.0 — aligned with Eventify API README and Mongoose models (`Event`, `Booking`, `User`).*
