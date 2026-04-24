# Eventify - Event Booking & Ticketing System

## 📋 Project Overview

**Eventify** is a comprehensive backend API for managing events, attendees, and bookings. Built with Node.js, Express.js, and MongoDB, it provides a robust platform where users can register, browse events, and book tickets while administrators have full control over event management.

---

## 🎯 Project Objectives

- Build a professional RESTful API following industry best practices
- Implement secure authentication and authorization using JWT
- Apply MVC (Model-View-Controller) architecture
- Work with MongoDB using Mongoose ODM
- Implement role-based access control (RBAC)
- Include advanced features: pagination, search, filtering, sorting, rate limiting, and logging

---

## 🏗️ System Architecture

### MVC Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client/Postman                 │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│                   Routes Layer                   │
│          (Define API endpoints)                  │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              Middleware Layer                    │
│    (Auth, Validation, Error Handling, Logger)    │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              Controllers Layer                   │
│         (Business logic & request handling)      │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│                 Models Layer                     │
│         (Mongoose schemas & models)              │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              MongoDB Database                    │
└─────────────────────────────────────────────────┘
```

---

## 🗄️ Database Design

### Collections

1. **Users** - User accounts and authentication
2. **Events** - Event listings with details
3. **Bookings** - Ticket bookings linking users and events

### Entity Relationships

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Users     │       │   Events     │       │   Bookings   │
│──────────────│       │──────────────│       │──────────────│
│ _id          │       │ _id          │       │ _id          │
│ name         │       │ title        │       │ userId  ─────│──→ Users._id
│ email        │       │ description  │       │ eventId ─────│──→ Events._id
│ password     │       │ date         │       │ quantity     │
│ role         │       │ location     │       │ totalPrice   │
│ createdAt    │       │ category     │       │ status       │
│ updatedAt    │       │ capacity     │       │ createdAt    │
│              │       │ availableSeats│       │ updatedAt    │
│              │       │ price        │       │              │
│              │       │ status       │       │              │
│              │       │ createdAt    │       │              │
│              │       │ updatedAt    │       │              │
│              │       │ createdBy    │───┐   │              │
└──────────────┘       └──────────────┘   │   └──────────────┘
                                          │
                                          └───→ Users._id
```

---

## 👥 Team Structure (5 Members)

| Member | Module | Responsibility |
|--------|--------|----------------|
| **Member 1** | Authentication & Authorization | User registration, login, JWT, role-based access |
| **Member 2** | Event Management | Full CRUD for events with pagination, search, filter, sort |
| **Member 3** | Booking Management | Ticket booking, cancellation, booking history |
| **Member 4** | Middleware & Utilities | Error handling, authentication middleware, logger, rate limiting |
| **Member 5** | API Documentation & Integration | Swagger docs, testing, integration, README |

---

## 🚀 Key Features

### Core Features
- ✅ User registration and login with email/password
- ✅ Password hashing using bcrypt
- ✅ JWT token generation and verification
- ✅ Role-based access control (Admin/User)
- ✅ Full CRUD operations for Events and Bookings
- ✅ Protected routes with JWT middleware

### Bonus Features
- ✅ Pagination for list endpoints
- ✅ Search functionality (events by title/description)
- ✅ Filtering (by category, date, location, price range)
- ✅ Sorting (by date, price, title, etc.)
- ✅ Rate limiting to prevent abuse
- ✅ Logging system for tracking actions

---

## 📁 Project Structure

```
eventify/
│
├── models/                    # Database models
│   ├── User.js
│   ├── Event.js
│   └── Booking.js
│
├── controllers/               # Request handlers
│   ├── authController.js
│   ├── eventController.js
│   └── bookingController.js
│
├── routes/                    # API routes
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── bookingRoutes.js
│
├── middlewares/               # Custom middleware
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── loggerMiddleware.js
│   └── rateLimiter.js
│
├── config/                    # Configuration files
│   └── db.js
│
├── utils/                     # Utility functions
│   ├── jwtUtils.js
│   └── validators.js
│
├── public/                    # Static files (if needed)
│
├── views/                     # Templates (optional)
│
├── tests/                     # Test files
│   └── api.test.js
│
├── docs/                      # Documentation
│   └── swagger.yaml
│
├── .env                       # Environment variables
├── .gitignore
├── app.js                     # Express app setup
├── server.js                  # Server entry point
├── package.json
└── README.md
```

---

## 🔐 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based authorization
- Rate limiting on API endpoints
- Input validation and sanitization
- Error handling without exposing sensitive data

---

## 📊 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get all events (with pagination, search, filter, sort)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)
- `DELETE /api/events/:id` - Delete event (Admin only)

### Bookings
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking status (Admin only)
- `DELETE /api/bookings/:id` - Cancel booking

### Admin
- `GET /api/admin/bookings` - Get all bookings (Admin only)
- `GET /api/admin/users` - Get all users (Admin only)

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| dotenv | Environment variables |
| express-rate-limit | Rate limiting |
| morgan | HTTP request logger |
| Swagger | API documentation |

---

## 📝 Development Workflow

1. **Clone the repository**
2. **Install dependencies** - `npm install`
3. **Set up environment variables** - Configure `.env` file
4. **Start development server** - `npm run dev`
5. **Test endpoints** - Use Postman or similar tool
6. **Document APIs** - Using Swagger
7. **Code review and testing**
8. **Deploy to production**

---

## 🎓 Learning Outcomes

By completing this project, team members will gain:
- Real-world experience with Node.js and Express
- MongoDB and Mongoose proficiency
- JWT authentication implementation
- MVC architecture understanding
- RESTful API design skills
- Team collaboration and version control
- API documentation best practices

---

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Swagger/OpenAPI](https://swagger.io/)

---

**Project Duration:** [To be determined by team]  
**GitHub Repository:** [To be created]

---

*Last Updated: April 2026*
