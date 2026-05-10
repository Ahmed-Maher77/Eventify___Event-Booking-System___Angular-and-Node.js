# Eventify

**Eventify** is a full-stack event discovery and booking system. The **Angular** front end serves guests, signed-in users, and administrators; the **Node.js / Express** API persists data in **MongoDB**, processes payments with **Stripe**, stores media on **Cloudinary**, and exposes an authenticated **AI assistant** for supported flows.

Treat this file as the project index. It points to the Markdown documentation set, summarizes setup and **npm** scripts for the `client` and `server` packages, and sketches how those parts connect in development and deployment.

---

## Table of contents

- [Documentation compass](#documentation-compass-all-markdown-files)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Frontend (client)](#frontend-client)
- [Backend (server)](#backend-server)
- [API reference & testing](#api-reference--testing)
- [Implementation notes](#implementation-notes)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

---

## Documentation compass (all Markdown files)

| Document | Purpose |
| -------- | ------- |
| [**README.md**](README.md) (this file) | Project overview, setup, scripts, and links to all other docs. |
| [**PROJECT_TASKS.md**](PROJECT_TASKS.md) | Delivery checklist: auth, events, bookings, payments, favorites, reviews, admin, AI, tests, and doc tasks. |
| [**SYSTEM_OPERATIONS_AND_USER_FLOWS.md**](SYSTEM_OPERATIONS_AND_USER_FLOWS.md) | End-to-end operations handbook: architecture, auth lifecycle, booking/checkout flows, admin flows, security summary, known gaps. |
| [**client/WEBSITE_DESIGN_ANALYSIS.md**](client/WEBSITE_DESIGN_ANALYSIS.md) | Frontend snapshot: routes, feature coverage, recent fixes, gaps, and recommended client priorities. |
| [**server/docs/guidelines/PROJECT_OVERVIEW.md**](server/docs/guidelines/PROJECT_OVERVIEW.md) | Backend modules, route mounts, operational features, and known gaps. |
| [**server/docs/guidelines/API_SPECIFICATIONS.md**](server/docs/guidelines/API_SPECIFICATIONS.md) | API specifications aligned with current routes. |
| [**server/docs/guidelines/CODING_STANDARDS.md**](server/docs/guidelines/CODING_STANDARDS.md) | Server coding conventions and standards. |
| [**server/docs/guidelines/BRUNO_INSTRUCTIONS.md**](server/docs/guidelines/BRUNO_INSTRUCTIONS.md) | How to use Bruno with this API. |
| [**server/docs/guidelines/MEMBER4_README.md**](server/docs/guidelines/MEMBER4_README.md) | Middleware and utilities status (auth, errors, logging, rate limits, validators). |
| [**server/docs/eventify-api/README.md**](server/docs/eventify-api/README.md) | Bruno collection scope, gaps vs live API, and CLI usage. |

**Suggested reading order for new contributors:** this README → `PROJECT_TASKS.md` → `SYSTEM_OPERATIONS_AND_USER_FLOWS.md` → `client/WEBSITE_DESIGN_ANALYSIS.md` + `server/docs/guidelines/PROJECT_OVERVIEW.md` → `API_SPECIFICATIONS.md`.

---

## Features

### Platform

- Public event browsing with search, filters, sorting, and pagination.
- User accounts: registration, login, logout, profile and password updates, avatar upload.
- Bookings: create, list, detail, confirmation, cancellation; quantity updates with validation.
- **Stripe** checkout: payment intent, sync, and webhook path (see server implementation).
- **Favorites** for events; reviews and votes on event detail.
- **Contact** and **newsletter** flows with admin moderation.
- **Admin** dashboard (KPIs, recent bookings, needs-attention), events, bookings (date-aware actions), users, messages, subscribers, assistant activity logs.
- **AI assistant**: authenticated chat completion and admin-visible activity logs.

### Backend (high level)

- REST API under `/api/*` with JWT (and cookie-related helpers where used).
- Role-based access (`user` / `admin`).
- Event CRUD for admins; public list/detail; images via URL, multipart upload, or placeholder; **Cloudinary** for uploads.
- Centralized validation, errors, logging, rate limiting, **Helmet**, **CORS**.
- **Swagger UI** at `/api-docs`; OpenAPI fragments under `server/docs/swagger`.

### Frontend (high level)

- **Angular** standalone components, lazy-loaded routes, RxJS and signals.
- Public marketing and legal pages; event catalog and detail; checkout; bookings; profile; favorites; AI chat surfaces.
- Admin dashboard and management UIs aligned with backend capabilities.

For granular “what exists / what is partial,” use [**client/WEBSITE_DESIGN_ANALYSIS.md**](client/WEBSITE_DESIGN_ANALYSIS.md) and [**server/docs/guidelines/PROJECT_OVERVIEW.md**](server/docs/guidelines/PROJECT_OVERVIEW.md).

---

## Tech stack

| Area | Technologies |
| ---- | ------------ |
| **Client** | Angular 21, TypeScript, Bootstrap, RxJS, Chart.js, GSAP, Swiper, Stripe.js, Font Awesome, Vitest (see `client/package.json`). |
| **Server** | Node.js (ESM), Express 5, MongoDB/Mongoose, JWT, bcryptjs, express-validator, express-rate-limit, Multer, Cloudinary, Stripe, OpenAI SDK, Swagger JSDoc/UI, Jest, Supertest (see `server/package.json`). |

---

## Repository layout

```text
client/                    Angular application (eventify-client)
  src/                     App source, routes, components, services
  .env                     BACKEND_API (see Frontend section)
  WEBSITE_DESIGN_ANALYSIS.md

server/                    Express API (eventify)
  src/
    app.js                 Express app
    server.js              Entry (default PORT 5000)
    config/                DB, env, uploads, cloudinary, etc.
    controllers/           Route handlers
    middlewares/           Auth, validation, errors, logging, limits
    models/                Mongoose models
    routes/                API routers
    utils/                 JWT, validators, uploads, etc.
  docs/
    swagger/               OpenAPI YAML fragments
    eventify-api/          Bruno collection + README
    guidelines/            PROJECT_OVERVIEW, API specs, coding standards, Bruno, middleware notes
  files/images/          Static assets (e.g. event placeholder)
  tests/                   Jest integration tests
  vercel.json              Example serverless rewrites (see Deployment)
```

Root-level [**PROJECT_TASKS.md**](PROJECT_TASKS.md) and [**SYSTEM_OPERATIONS_AND_USER_FLOWS.md**](SYSTEM_OPERATIONS_AND_USER_FLOWS.md) describe cross-cutting work and flows.

---

## Prerequisites

- **Node.js** 18 or newer (match your Angular/CLI requirements as needed).
- **npm** (client pins a package manager version in `client/package.json`).
- **MongoDB** locally or **MongoDB Atlas** URI.
- Optional: **Stripe**, **Cloudinary**, and **OpenAI** (or related) keys for full payment, media, and chat behavior.

---

## Quick start

### 1. API (`server`)

```bash
cd server
npm install
```

Create `server/.env` (see [Environment variables](#environment-variables)). Then:

```bash
npm run dev
```

- API base: `http://localhost:5000` (or your `PORT`)
- Swagger: `http://localhost:5000/api-docs`

### 2. Client (`client`)

```bash
cd client
npm install
```

Create `client/.env` with your API base, for example:

```env
BACKEND_API=http://localhost:5000/api
```

Then:

```bash
npm start
```

This runs `ng serve -o` (dev server with browser open). Point `BACKEND_API` at your deployed API when not using localhost.

---

## Environment variables

**Do not commit real secrets.** Use placeholders locally and rotate anything that was ever exposed.

### Server (`server/.env`)

Typical variables include (names may vary slightly by branch; confirm in `server/src/config`):

| Variable | Role |
| -------- | ---- |
| `MONGO_URI` | MongoDB connection string |
| `PORT` | HTTP port (default **5000** if unset) |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | JWT signing and lifetime |
| `CLOUDINARY_*` | Cloudinary cloud name, key, secret |
| Stripe and webhook-related keys | Checkout and payment confirmation |
| OpenAI (or related) | AI chat backend |

### Client (`client/.env`)

| Variable | Role |
| -------- | ---- |
| `BACKEND_API` | Base URL for API calls (e.g. `http://localhost:5000/api`) |

---

## Scripts

### Server (`server/package.json`)

| Script | Command | Description |
| ------ | ------- | ----------- |
| `dev` | `npm run dev` | Run API with **nodemon** (reload on change). |
| `start` | `npm start` | Run API with **node** (production-style). |
| `seed:admin` | `npm run seed:admin` | Seed an initial admin account (`src/scripts/seedAdmin.js`). |
| `test` | `npm test` | Jest integration tests (**runInBand**). |

### Client (`client/package.json`)

| Script | Command | Description |
| ------ | ------- | ----------- |
| `start` | `npm start` | `ng serve -o` — dev server and open browser. |
| `build` | `npm run build` | Production build. |
| `watch` | `npm run watch` | Development build with watch. |
| `test` | `npm test` | `ng test` (client unit tests). |

---

## Frontend (client)

- **Stack and routes:** [**client/WEBSITE_DESIGN_ANALYSIS.md**](client/WEBSITE_DESIGN_ANALYSIS.md)
- **Env:** `BACKEND_API` in `client/.env` (documented in that file).
- **Implementation areas:** auth, events, bookings, checkout (Stripe UI), favorites, profile (including avatar), admin dashboard and CRUD-style management pages, AI chat UI.

For UX gaps and next steps (e.g. orders placeholder, forgot-password flow), see the “Known gaps” sections in **WEBSITE_DESIGN_ANALYSIS.md** and **SYSTEM_OPERATIONS_AND_USER_FLOWS.md**.

---

## Backend (server)

- **Modules and routes:** [**server/docs/guidelines/PROJECT_OVERVIEW.md**](server/docs/guidelines/PROJECT_OVERVIEW.md)
- **API contract details:** [**server/docs/guidelines/API_SPECIFICATIONS.md**](server/docs/guidelines/API_SPECIFICATIONS.md)
- **Conventions:** [**server/docs/guidelines/CODING_STANDARDS.md**](server/docs/guidelines/CODING_STANDARDS.md)
- **Middleware map:** [**server/docs/guidelines/MEMBER4_README.md**](server/docs/guidelines/MEMBER4_README.md)

Mounted route families include (non-exhaustive): `/api/auth`, `/api/events`, `/api/favorites`, `/api/bookings`, `/api/checkout`, `/api/contact`, `/api/newsletter`, `/api/chat`, `/api/admin`, plus event reviews as implemented in code—verify in **PROJECT_OVERVIEW** and **API_SPECIFICATIONS**.

---

## API reference & testing

- **Interactive docs:** run the server and open **`/api-docs`** (Swagger UI).
- **OpenAPI sources:** `server/docs/swagger/*.yaml`
- **Bruno:** import `server/docs/eventify-api`; read [**server/docs/eventify-api/README.md**](server/docs/eventify-api/README.md) for coverage vs the live API and [**server/docs/guidelines/BRUNO_INSTRUCTIONS.md**](server/docs/guidelines/BRUNO_INSTRUCTIONS.md) for usage.

---

## Implementation notes

- **Cross-cutting flows** (registration through checkout, admin moderation, AI chat): [**SYSTEM_OPERATIONS_AND_USER_FLOWS.md**](SYSTEM_OPERATIONS_AND_USER_FLOWS.md)
- **Task and roadmap checklist:** [**PROJECT_TASKS.md**](PROJECT_TASKS.md)
- Booking rules, payment boundaries, and known backend gaps are summarized in **PROJECT_OVERVIEW** and **SYSTEM_OPERATIONS_AND_USER_FLOWS**.

---

## Testing

| Scope | Where | Command |
| ----- | ----- | ------- |
| Server integration | `server/tests` | `cd server && npm test` |
| Client unit | `client` | `cd client && npm test` |

See **PROJECT_TASKS.md** for planned coverage (E2E, checkout/booking matrix tests, CI).

<!-- ---

## Deployment

- The server folder includes [**server/vercel.json**](server/vercel.json) with rewrites toward `api/index.js` and a function `maxDuration` example—adjust to your hosting layout.
- Set production `MONGO_URI`, JWT, Stripe, Cloudinary, and CORS/origin policies to match your Angular deployment URL. -->

---

## License

This project is part of the Eventify codebase.
