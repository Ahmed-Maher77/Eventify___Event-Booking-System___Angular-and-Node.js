# Eventify API

Eventify is a Node.js REST API for event management and ticket booking. It supports user authentication, role-based access control, event CRUD, booking management, image uploads (Multer + Cloudinary), rate limiting, structured logging, and interactive API documentation.

## Features

- User registration and login with JWT authentication
- Role-based authorization for admin and user actions
- Event management with create, read, update, and delete operations
- Booking workflow for reserving, viewing, and cancelling bookings
- Admin booking oversight and booking status management
- Event image handling with three options:
    - `imageUrl` (external direct URL)
    - file upload via `multipart/form-data` + Multer (`image` field)
    - automatic placeholder fallback (`/files/images/event-placeholder.svg`)
- Cloudinary external media storage for uploaded event images
- Pagination, filtering, search, and sorting on list endpoints
- Centralized validation, error handling, and request logging
- Swagger/OpenAPI documentation and Bruno collections for API testing

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- express-validator for input validation
- express-rate-limit for abuse protection
- Multer for multipart file handling
- Cloudinary for external image storage
- Swagger UI for API documentation
- Jest for testing
- Supertest for HTTP endpoint testing

## Project Structure

```text
docs/
  swagger/               OpenAPI fragments
  eventify-api/          Bruno API collection
  guidelines/            Project and API guidelines
src/
  app.js                 Express app setup
  server.js              Server entry point
  config/                Database and app configuration (db, multer, cloudinary)
  controllers/           Request handlers
  middlewares/           Auth, validation, logging, error handling
  models/                Mongoose schemas
  routes/                API route definitions
  utils/                 Validation, JWT, and Cloudinary upload helpers
files/
  images/
    event-placeholder.svg Default local placeholder image
tests/
  setup.js               Shared test environment setup
  integration/
    auth.test.js         Auth route tests
    event.test.js        Event route tests
    booking.test.js      Booking/Admin route tests
.env                     Environment variables
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- MongoDB running locally or a MongoDB Atlas connection string
- npm

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root and define the required variables for your environment.

```env
MONGO_URI=mongodb://localhost:27017/eventify
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=djpxtccbf
CLOUDINARY_API_KEY=792738921521235
CLOUDINARY_API_SECRET=_oMEEDdPYxk_kMZRi4FvSrN0auI
```

If your implementation uses additional values for seeded accounts or deployment, add them here as needed. For production, rotate secrets and never commit sensitive credentials.

### Run the Project

```bash
npm run dev
```

For production:

```bash
npm start
```

## API Documentation

When the server is running:

- API root: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`

The OpenAPI fragments live in `docs/swagger`, and the Bruno collection is available in `docs/eventify-api` for local API testing.

## Main Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate an existing user

### Events

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get a single event
- `POST /api/events` - Create an event (admin only)
- `PUT /api/events/:id` - Update an event (admin only)
- `DELETE /api/events/:id` - Delete an event (admin only)

#### Event image upload behavior

- Create/update routes accept `multipart/form-data` with file field name: `image`
- The route middleware uses `uploadImage.single("image")`
- If file is uploaded, backend uploads it to Cloudinary and stores:
    - `image`: Cloudinary `secure_url`
    - `imagePublicId`: Cloudinary `public_id` for later cleanup
- If `imageUrl` is provided in body, it is used directly (and previous Cloudinary image is removed on update)
- If neither `image` nor `imageUrl` is provided, the model default is used:
    - `/files/images/event-placeholder.svg`
- On event delete, Cloudinary image is removed automatically if `imagePublicId` exists

#### Event model updates

`Event` now includes:

- `image` (`String`) with default `/files/images/event-placeholder.svg`
- `imagePublicId` (`String | null`) for Cloudinary asset lifecycle management

### Bookings

- `GET /api/bookings` - Get the authenticated user's bookings
- `GET /api/bookings/:id` - Get a single booking
- `POST /api/bookings` - Create a booking
- `PATCH /api/bookings/:id` - Update booking status (admin only)
- `DELETE /api/bookings/:id` - Cancel a booking

### Admin

- `GET /api/admin/bookings` - Get all bookings (admin only)

## Bruno Collection

The project includes a Bruno collection under `docs/eventify-api` with organized folders for:

- Authentication
- Events
- Bookings
- Admin

Use the collection to run and test requests locally against the API.

## Testing

The project uses Jest and Supertest for automated API tests.

### Run Tests

```bash
npm test
```

### Current Test Coverage

- Auth routes:
    - Register success and validation failure
    - Login success and invalid credentials
- Event routes:
    - Public get all events
    - Public get single event
    - Admin create, update, and delete event
- Booking/Admin routes:
    - User get bookings, get single booking, create booking, cancel booking
    - Admin update booking status
    - Admin get all bookings

### Notes

- Tests are designed to run fast and deterministically by mocking model/auth dependencies.
- The test suite runs in-band to avoid ESM/Jest concurrency issues in this setup.

## Development Notes

- The server loads configuration from `.env` at the project root
- Swagger docs are mounted at `/api-docs`
- All protected endpoints require a valid Bearer token
- Admin routes require a user with the `admin` role

## Scripts

```bash
npm run dev        # Start the server in development mode
npm start          # Start the server in production mode
npm run seed:admin # Seed an initial admin account
npm test           # Run Jest integration tests
```

## License

This project is part of the Eventify codebase.
