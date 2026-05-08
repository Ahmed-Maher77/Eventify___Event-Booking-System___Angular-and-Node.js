# Eventify Bruno Collection

Bruno collection for Eventify API requests under `server/docs/eventify-api`.

## Current Collection Scope

The collection currently covers:

- Auth (`register`, `login`)
- Events (`get/create/update/delete`)
- Booking core flows (`get user bookings`, `get single booking`, `create`, `cancel`)
- Admin bookings listing
- Chat completion endpoint

## Important Gap

The backend has grown beyond the current collection. The following endpoints exist in code but are not yet fully represented in this Bruno set:

- Favorites endpoints
- Checkout payment endpoints (`payment-intent`, `sync-payment`)
- Event reviews endpoints
- Admin users/messages/subscribers/assistant-activity endpoints
- Auth profile/password/account update endpoints

If you use this collection for QA, treat it as **partial coverage** and extend it as needed.

## Quick Start

1. Open Bruno.
2. Import `server/docs/eventify-api`.
3. Select `Local` environment.
4. Set:
   - `baseUrl` (for example `http://localhost:5000`)
   - login credentials in environment variables used by requests
5. Run auth requests first to capture token/cookies.

## Running with CLI

```bash
cd server/docs/eventify-api
bru run --env Local
```

Run tests only:

```bash
bru run --env Local --tests
```

## Suggested Next Collection Additions

1. Add a `Favorites` folder.
2. Add `Checkout` folder with payment-intent and sync-payment requests.
3. Add `Event Reviews` folder.
4. Expand `Admin` folder to include users/messages/subscribers/assistant logs.
5. Add auth profile/password/account routes.

---

Last updated: 2026-05-08
