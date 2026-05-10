# Eventify

**Eventify** is a full-stack event discovery and booking system with a **database-driven RAG AI chatbot**. The **Angular** client serves guests, signed-in users, and administrators. The **Node.js / Express** API uses **MongoDB** for events, bookings, and assistant telemetry; **Stripe** and **Cloudinary** for payments and media; and an authenticated **`/api/chat/completions`** flow that **retrieves live event rows from MongoDB** (keyword and synonym expansion over upcoming events), **injects them into the LLM system prompt**, and returns grounded answers via **Groq** (OpenAI-compatible SDK). Administrators can review assistant activity in the dashboard.

This file is the project index: Markdown documentation map, **npm** scripts for `client` and `server`, environment variables (including **`GROQ_API_KEY`**), and how the apps connect for local work and deployment.

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
- [Security & secrets](#security--secrets)
- [Deployment](#deployment)
- [License](#license)

---

## Documentation compass (all Markdown files)

| Document                                                                                         | Purpose                                                                                                                          |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| [**README.md**](README.md) (this file)                                                           | Project overview, setup, RAG chatbot architecture, scripts, and links to all other docs.                                         |
| [**PROJECT_TASKS.md**](PROJECT_TASKS.md)                                                         | Technical delivery tracker: shipped vs planned capabilities across modules, QA, and documentation.                               |
| [**SYSTEM_OPERATIONS_AND_USER_FLOWS.md**](SYSTEM_OPERATIONS_AND_USER_FLOWS.md)                   | End-to-end operations handbook: architecture, auth lifecycle, booking/checkout flows, admin flows, security summary, known gaps. |
| [**client/WEBSITE_DESIGN_ANALYSIS.md**](client/WEBSITE_DESIGN_ANALYSIS.md)                       | Frontend snapshot: routes, feature coverage, recent fixes, gaps, and recommended client priorities.                              |
| [**server/docs/guidelines/PROJECT_OVERVIEW.md**](server/docs/guidelines/PROJECT_OVERVIEW.md)     | Backend modules, route mounts, operational features, and known gaps.                                                             |
| [**server/docs/guidelines/API_SPECIFICATIONS.md**](server/docs/guidelines/API_SPECIFICATIONS.md) | API specifications aligned with current routes.                                                                                  |
| [**server/docs/guidelines/CODING_STANDARDS.md**](server/docs/guidelines/CODING_STANDARDS.md)     | Server coding conventions and standards.                                                                                         |
| [**server/docs/guidelines/BRUNO_INSTRUCTIONS.md**](server/docs/guidelines/BRUNO_INSTRUCTIONS.md) | How to use Bruno with this API.                                                                                                  |
| [**server/docs/guidelines/MEMBER4_README.md**](server/docs/guidelines/MEMBER4_README.md)         | Middleware and utilities status (auth, errors, logging, rate limits, validators).                                                |
| [**server/docs/eventify-api/README.md**](server/docs/eventify-api/README.md)                     | Bruno collection scope, gaps vs live API, and CLI usage.                                                                         |

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
- **AI assistant (RAG)**: signed-in users chat with **Eventify AI**; each turn pulls **relevant upcoming events from MongoDB** before calling the LLM (see [AI assistant (database-driven RAG)](#ai-assistant-database-driven-rag)); admins inspect **assistant activity** logs.

### Backend (high level)

- REST API under `/api/*` with JWT (and cookie-related helpers where used).
- Role-based access (`user` / `admin`).
- Event CRUD for admins; public list/detail; images via URL, multipart upload, or placeholder; **Cloudinary** for uploads.
- Centralized validation, errors, logging, rate limiting, **Helmet**, **CORS**.
- **Swagger UI** at `/api-docs`; OpenAPI fragments under `server/docs/swagger`.
- **Chat + RAG**: `POST /api/chat/completions` (protected) uses `knowledgeBaseService` → MongoDB `Event` queries → prompt assembly in `chatController` → `aiChatProvider` (Groq); `AssistantActivity` persists queries, replies, and retrieval metadata.

### Frontend (high level)

- **Angular** standalone components, lazy-loaded routes, RxJS and signals.
- Public marketing and legal pages; event catalog and detail; checkout; bookings; profile; favorites; **AI chat widget / surfaces** wired to the RAG completion API.
- Admin dashboard and management UIs aligned with backend capabilities, including **assistant activity** review.

For granular “what exists / what is partial,” use [**client/WEBSITE_DESIGN_ANALYSIS.md**](client/WEBSITE_DESIGN_ANALYSIS.md) and [**server/docs/guidelines/PROJECT_OVERVIEW.md**](server/docs/guidelines/PROJECT_OVERVIEW.md).

---

## AI assistant (database-driven RAG)

| Step | Implementation |
| ---- | ---------------- |
| **Retrieve** | `server/src/services/knowledgeBaseService.js` loads **upcoming** `Event` documents from MongoDB. The user’s last message is tokenized into keywords (with light synonym expansion); a **MongoDB `$regex`** query matches title, category, location, and description. If no keywords match, a small default set of upcoming events is used so the model still has catalog context. |
| **Augment** | `server/src/controllers/chatController.js` formats those documents into text and **embeds them in the system prompt** before the conversational messages. |
| **Generate** | `server/src/services/aiChatProvider.js` calls **Groq** (`GROQ_API_KEY`, optional `GROQ_MODEL`) through the **OpenAI-compatible** Node client. |
| **Observe** | Each successful turn logs to **`AssistantActivity`** (user, session, query, reply, model, latency, **relevantEventsCount**) for admin review. |

Retrieval is **database-backed and lexical** (not vector embeddings in the current codebase), which keeps the stack simple while still following the **RAG** pattern: *retrieve from your source of truth, then generate*.

---

## Tech stack

| Area       | Technologies                                                                                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Design** | UI/UX design, wireframing, prototyping, Figma.                                                                                                                                                           |
| **Client** | Angular 21, TypeScript, Bootstrap, RxJS, Chart.js, GSAP, Swiper, Stripe.js, Font Awesome, Vitest (see `client/package.json`).                                                                            |
| **Server** | Node.js (ESM), Express 5, MongoDB/Mongoose, JWT, bcryptjs, express-validator, express-rate-limit, Multer, Cloudinary, Stripe, **OpenAI SDK → Groq** (chat completions), Swagger JSDoc/UI, Jest, Supertest (see `server/package.json`). |

---

## Repository layout

Skeleton of the repository (major paths only; `node_modules`, build output, and incidental files are omitted).

```text
.
├── README.md
├── PROJECT_TASKS.md
├── SYSTEM_OPERATIONS_AND_USER_FLOWS.md
├── client/                          # Angular app (eventify-client)
│   ├── public/
│   ├── src/
│   │   ├── app/                     # routes, pages, components, services, shared UI
│   │   └── sass/
│   ├── angular.json
│   ├── package.json
│   └── WEBSITE_DESIGN_ANALYSIS.md
└── server/                          # Express API (eventify)
    ├── api/                         # serverless entry (e.g. Vercel)
    ├── docs/
    │   ├── swagger/               # OpenAPI YAML fragments
    │   ├── eventify-api/          # Bruno collection
    │   └── guidelines/            # overview, API spec, coding standards, Bruno notes
    ├── files/
    │   └── images/
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middlewares/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   ├── scripts/
    │   ├── utils/
    │   ├── app.js
    │   └── server.js
    ├── tests/
    ├── package.json
    └── vercel.json
```

Create **`client/.env`** and **`server/.env`** locally (they are not shown in the tree). Copy from [**client/.env.example**](client/.env.example) and [**server/.env.example**](server/.env.example) as templates; see [Environment variables](#environment-variables) and [Security & secrets](#security--secrets).

Root-level [**PROJECT_TASKS.md**](PROJECT_TASKS.md) and [**SYSTEM_OPERATIONS_AND_USER_FLOWS.md**](SYSTEM_OPERATIONS_AND_USER_FLOWS.md) describe cross-cutting work and flows.

---

## Prerequisites

- **Node.js** 18 or newer (match your Angular/CLI requirements as needed).
- **npm** (client pins a package manager version in `client/package.json`).
- **MongoDB** locally or **MongoDB Atlas** URI.
- Optional: **Stripe**, **Cloudinary**, and **Groq** (`GROQ_API_KEY`, optional `GROQ_MODEL`) for payments, media, and the RAG chatbot.

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

| Variable                        | Role                                  |
| ------------------------------- | ------------------------------------- |
| `MONGO_URI`                     | MongoDB connection string             |
| `PORT`                          | HTTP port (default **5000** if unset) |
| `JWT_SECRET` / `JWT_EXPIRE`     | JWT signing and lifetime (`JWT_EXPIRE` default `7d` in code) |
| `CLOUDINARY_*`                  | Cloudinary cloud name, key, secret    |
| Stripe and webhook-related keys | Checkout and payment confirmation     |
| `GROQ_API_KEY`                  | Groq API key for the chat LLM         |
| `GROQ_MODEL`                    | Optional model id (default in code)   |
| `SEED_ADMIN_PASSWORD`           | Admin seed password (or pass as CLI arg; min 8 chars) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_NAME` | Optional overrides for `npm run seed:admin` |

### Client (`client/.env`)

| Variable      | Role                                                      |
| ------------- | --------------------------------------------------------- |
| `BACKEND_API` | Base URL for API calls (e.g. `http://localhost:5000/api`) |

---

## Scripts

### Server (`server/package.json`)

| Script       | Command              | Description                                                 |
| ------------ | -------------------- | ----------------------------------------------------------- |
| `dev`        | `npm run dev`        | Run API with **nodemon** (reload on change).                |
| `start`      | `npm start`          | Run API with **node** (production-style).                   |
| `seed:admin` | `npm run seed:admin` | Seed an admin user; requires **`SEED_ADMIN_PASSWORD`** (or password as third CLI arg). Does **not** print the password. See `server/src/scripts/seedAdmin.js`. |
| `test`       | `npm test`           | Jest integration tests (**runInBand**).                     |

### Client (`client/package.json`)

| Script  | Command         | Description                                  |
| ------- | --------------- | -------------------------------------------- |
| `start` | `npm start`     | `ng serve -o` — dev server and open browser. |
| `build` | `npm run build` | Production build.                            |
| `watch` | `npm run watch` | Development build with watch.                |
| `test`  | `npm test`      | `ng test` (client unit tests).               |

---

## Frontend (client)

- **Stack and routes:** [**client/WEBSITE_DESIGN_ANALYSIS.md**](client/WEBSITE_DESIGN_ANALYSIS.md)
- **Env:** `BACKEND_API` in `client/.env` (documented in that file).
- **Implementation areas:** auth, events, bookings, checkout (Stripe UI), favorites, profile (including avatar), admin dashboard and CRUD-style management pages, **RAG chat UI** (completion client against `/api/chat/completions`).

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

- **Cross-cutting flows** (registration through checkout, admin moderation, **RAG chatbot**): [**SYSTEM_OPERATIONS_AND_USER_FLOWS.md**](SYSTEM_OPERATIONS_AND_USER_FLOWS.md)
- **Technical delivery tracker:** [**PROJECT_TASKS.md**](PROJECT_TASKS.md)
- Booking rules, payment boundaries, and known backend gaps are summarized in **PROJECT_OVERVIEW** and **SYSTEM_OPERATIONS_AND_USER_FLOWS**.

---

## Testing

| Scope              | Where          | Command                 |
| ------------------ | -------------- | ----------------------- |
| Server integration | `server/tests` | `cd server && npm test` |
| Client unit        | `client`       | `cd client && npm test` |

See **PROJECT_TASKS.md** for planned coverage (E2E, checkout/booking matrix tests, CI).

---

## Security & secrets

- **`.env` is ignored** at the repo root, under `client/`, and under `server/` (see `.gitignore` files). Use local env files or your host’s secret store only.
- **Never commit** API keys, JWT secrets, Stripe/Cloudinary/Groq credentials, database passwords, or personal phone/email in source. Replace demo contact/social URLs in the client before production.
- **`npm run seed:admin`** must receive a strong password via **`SEED_ADMIN_PASSWORD`** or the third CLI argument; the script does not log the password.
- **Bruno** `Local.yml` should use your own test accounts; treat `authToken` and passwords as secrets (`secret: true` is already set where applicable).
- If anything sensitive was ever pushed, **rotate** those credentials in the provider dashboards and scrub git history if required.

---

## Deployment

- The server folder includes [**server/vercel.json**](server/vercel.json) with rewrites toward `api/index.js` and a function `maxDuration` example—adjust to your hosting layout.
- Set production `MONGO_URI`, JWT, Stripe, Cloudinary, Groq, and CORS/origin policies to match your Angular deployment URL.

---

## License

This project is part of the Eventify codebase.
