# API Specifications

Complete documentation for all API endpoints in the Eventify system.

---

## 📋 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Event Endpoints](#event-endpoints)
3. [Booking Endpoints](#booking-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Query Parameters](#query-parameters)
6. [Response Format](#response-format)
7. [Error Codes](#error-codes)

---

## 🔐 Authentication Endpoints

### 1. Register User

**POST** `/api/auth/register`

**Description:** Register a new user account

**Request Body:**

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
}
```

**Validation Rules:**

- `name`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `password`: Required, minimum 6 characters, must contain uppercase, lowercase, number

**Success Response (201):**

```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "John Doe",
            "email": "john@example.com",
            "role": "user"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Error Response (400):**

```json
{
    "success": false,
    "message": "Email already exists"
}
```

---

### 2. Login User

**POST** `/api/auth/login`

**Description:** Authenticate user and return JWT token

**Request Body:**

```json
{
    "email": "john@example.com",
    "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "John Doe",
            "email": "john@example.com",
            "role": "user"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Error Response (401):**

```json
{
    "success": false,
    "message": "Invalid email or password"
}
```

---

## 🎪 Event Endpoints

### 1. Get All Events

**GET** `/api/events`

**Description:** Retrieve paginated list of events with optional search, filter, and sort

**Query Parameters:**

| Parameter   | Type   | Required | Description                                  |
| ----------- | ------ | -------- | -------------------------------------------- |
| `page`      | Number | No       | Page number (default: 1)                     |
| `limit`     | Number | No       | Items per page (default: 10)                 |
| `search`    | String | No       | Search in title/description                  |
| `category`  | String | No       | Filter by category                           |
| `location`  | String | No       | Filter by location                           |
| `minPrice`  | Number | No       | Minimum price filter                         |
| `maxPrice`  | Number | No       | Maximum price filter                         |
| `startDate` | Date   | No       | Filter events from this date                 |
| `endDate`   | Date   | No       | Filter events until this date                |
| `sort`      | String | No       | Sort field (e.g., `date`, `price`, `title`)  |
| `order`     | String | No       | Sort order: `asc` or `desc` (default: `asc`) |

**Example Request:**

```
GET /api/events?page=1&limit=10&search=music&category=concert&sort=date&order=desc
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Events retrieved successfully",
    "data": {
        "events": [
            {
                "_id": "507f1f77bcf86cd799439011",
                "title": "Summer Music Festival",
                "description": "Annual summer music event",
                "date": "2026-07-15T18:00:00.000Z",
                "location": "Central Park, NY",
                "category": "concert",
                "capacity": 1000,
                "availableSeats": 750,
                "price": 50,
                "createdBy": {
                    "_id": "507f1f77bcf86cd799439012",
                    "name": "Admin User"
                }
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalEvents": 50,
            "limit": 10
        }
    }
}
```

---

### 2. Get Single Event

**GET** `/api/events/:id`

**Description:** Get details of a specific event

**Parameters:**

- `id`: Event MongoDB ObjectId (required)

**Success Response (200):**

```json
{
    "success": true,
    "message": "Event retrieved successfully",
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Summer Music Festival",
        "description": "Annual summer music event featuring top artists",
        "date": "2026-07-15T18:00:00.000Z",
        "location": "Central Park, NY",
        "category": "concert",
        "capacity": 1000,
        "availableSeats": 750,
        "price": 50,
        "createdBy": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Admin User"
        },
        "createdAt": "2026-04-01T10:00:00.000Z",
        "updatedAt": "2026-04-05T15:30:00.000Z"
    }
}
```

**Error Response (404):**

```json
{
    "success": false,
    "message": "Event not found"
}
```

---

### 3. Create Event (Admin Only)

**POST** `/api/events`

**Description:** Create a new event (requires admin role)

**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:**

```json
{
    "title": "Tech Conference 2026",
    "description": "Annual technology conference",
    "date": "2026-09-20T09:00:00.000Z",
    "location": "Convention Center, San Francisco",
    "category": "conference",
    "capacity": 500,
    "price": 150,
    "createdBy": "507f1f77bcf86cd799439012"
}
```

**Validation Rules:**

- `title`: Required, 3-100 characters
- `description`: Required, 10-1000 characters
- `date`: Required, valid date, must be in the future
- `location`: Required, 3-200 characters
- `category`: Required, one of: `concert`, `conference`, `workshop`, `seminar`, `sports`, `other`
- `capacity`: Required, positive integer
- `price`: Required, non-negative number
- `createdBy`: Required, valid MongoDB ObjectId (admin user ID)

**Success Response (201):**

```json
{
    "success": true,
    "message": "Event created successfully",
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Tech Conference 2026",
        "description": "Annual technology conference",
        "date": "2026-09-20T09:00:00.000Z",
        "location": "Convention Center, San Francisco",
        "category": "conference",
        "capacity": 500,
        "availableSeats": 500,
        "price": 150,
        "createdBy": "507f1f77bcf86cd799439012",
        "createdAt": "2026-04-07T10:00:00.000Z",
        "updatedAt": "2026-04-07T10:00:00.000Z"
    }
}
```

**Error Response (403):**

```json
{
    "success": false,
    "message": "Not authorized to access this route"
}
```

---

### 4. Update Event (Admin Only)

**PUT** `/api/events/:id`

**Description:** Update an existing event (requires admin role)

**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:** (All fields optional)

```json
{
    "title": "Updated Tech Conference 2026",
    "description": "Updated description",
    "capacity": 600
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Event updated successfully",
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Updated Tech Conference 2026",
        "description": "Updated description",
        "date": "2026-09-20T09:00:00.000Z",
        "location": "Convention Center, San Francisco",
        "category": "conference",
        "capacity": 600,
        "availableSeats": 600,
        "price": 150,
        "createdBy": "507f1f77bcf86cd799439012",
        "createdAt": "2026-04-07T10:00:00.000Z",
        "updatedAt": "2026-04-07T12:00:00.000Z"
    }
}
```

---

### 5. Delete Event (Admin Only)

**DELETE** `/api/events/:id`

**Description:** Delete an event (requires admin role)

**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Success Response (200):**

```json
{
    "success": true,
    "message": "Event deleted successfully"
}
```

**Error Response (404):**

```json
{
    "success": false,
    "message": "Event not found"
}
```

---

## 🎫 Booking Endpoints

### 1. Get User Bookings

**GET** `/api/bookings`

**Description:** Get all bookings for the authenticated user

**Authentication:** Required (Bearer Token)

**Query Parameters:**

| Parameter | Type   | Required | Description                                           |
| --------- | ------ | -------- | ----------------------------------------------------- |
| `page`    | Number | No       | Page number (default: 1)                              |
| `limit`   | Number | No       | Items per page (default: 10)                          |
| `status`  | String | No       | Filter by status: `confirmed`, `pending`, `cancelled` |

**Success Response (200):**

```json
{
    "success": true,
    "message": "Bookings retrieved successfully",
    "data": {
        "bookings": [
            {
                "_id": "507f1f77bcf86cd799439020",
                "event": {
                    "_id": "507f1f77bcf86cd799439011",
                    "title": "Summer Music Festival",
                    "date": "2026-07-15T18:00:00.000Z",
                    "location": "Central Park, NY"
                },
                "quantity": 2,
                "totalPrice": 100,
                "status": "confirmed",
                "createdAt": "2026-04-07T10:00:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 1,
            "totalBookings": 1,
            "limit": 10
        }
    }
}
```

---

### 2. Get Single Booking

**GET** `/api/bookings/:id`

**Description:** Get details of a specific booking

**Authentication:** Required (Bearer Token)

**Success Response (200):**

```json
{
    "success": true,
    "message": "Booking retrieved successfully",
    "data": {
        "_id": "507f1f77bcf86cd799439020",
        "user": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "John Doe",
            "email": "john@example.com"
        },
        "event": {
            "_id": "507f1f77bcf86cd799439011",
            "title": "Summer Music Festival",
            "date": "2026-07-15T18:00:00.000Z",
            "location": "Central Park, NY",
            "price": 50
        },
        "quantity": 2,
        "totalPrice": 100,
        "status": "confirmed",
        "createdAt": "2026-04-07T10:00:00.000Z",
        "updatedAt": "2026-04-07T10:00:00.000Z"
    }
}
```

---

### 3. Create Booking

**POST** `/api/bookings`

**Description:** Book tickets for an event

**Authentication:** Required (Bearer Token)

**Request Body:**

```json
{
    "eventId": "507f1f77bcf86cd799439011",
    "quantity": 2
}
```

**Validation Rules:**

- `eventId`: Required, valid MongoDB ObjectId
- `quantity`: Required, positive integer, must not exceed available seats

**Business Logic:**

1. Check if event exists
2. Check if event has available seats
3. Calculate total price (quantity × event price)
4. Create booking
5. Update event availableSeats
6. Log the booking

**Success Response (201):**

```json
{
    "success": true,
    "message": "Booking created successfully",
    "data": {
        "_id": "507f1f77bcf86cd799439020",
        "user": "507f1f77bcf86cd799439012",
        "event": "507f1f77bcf86cd799439011",
        "quantity": 2,
        "totalPrice": 100,
        "status": "confirmed",
        "createdAt": "2026-04-07T10:00:00.000Z",
        "updatedAt": "2026-04-07T10:00:00.000Z"
    }
}
```

**Error Response (400):**

```json
{
    "success": false,
    "message": "Not enough available seats"
}
```

**Error Response (404):**

```json
{
    "success": false,
    "message": "Event not found"
}
```

---

### 4. Update Booking Status (Admin Only)

**PATCH** `/api/bookings/:id`

**Description:** Update booking status (requires admin role)

**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:**

```json
{
    "status": "cancelled"
}
```

**Valid Statuses:** `confirmed`, `pending`, `cancelled`

**Success Response (200):**

```json
{
    "success": true,
    "message": "Booking status updated successfully",
    "data": {
        "_id": "507f1f77bcf86cd799439020",
        "user": "507f1f77bcf86cd799439012",
        "event": "507f1f77bcf86cd799439011",
        "quantity": 2,
        "totalPrice": 100,
        "status": "cancelled",
        "createdAt": "2026-04-07T10:00:00.000Z",
        "updatedAt": "2026-04-07T14:00:00.000Z"
    }
}
```

---

### 5. Cancel Booking

**DELETE** `/api/bookings/:id`

**Description:** Cancel a booking (user can cancel their own, admin can cancel any)

**Authentication:** Required (Bearer Token)

**Business Logic:**

1. Verify booking exists
2. Check if user owns booking or is admin
3. Update booking status to "cancelled"
4. Restore event availableSeats

**Success Response (200):**

```json
{
    "success": true,
    "message": "Booking cancelled successfully"
}
```

---

## 👑 Admin Endpoints

### 1. Get All Bookings (Admin Only)

**GET** `/api/admin/bookings`

**Description:** Get all bookings across all users and events (requires admin role)

**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Query Parameters:**

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `page`    | Number | No       | Page number (default: 1)     |
| `limit`   | Number | No       | Items per page (default: 10) |
| `status`  | String | No       | Filter by status             |
| `eventId` | String | No       | Filter by event ID           |
| `userId`  | String | No       | Filter by user ID            |

**Success Response (200):**

```json
{
    "success": true,
    "message": "All bookings retrieved successfully",
    "data": {
        "bookings": [
            {
                "_id": "507f1f77bcf86cd799439020",
                "user": {
                    "_id": "507f1f77bcf86cd799439012",
                    "name": "John Doe",
                    "email": "john@example.com"
                },
                "event": {
                    "_id": "507f1f77bcf86cd799439011",
                    "title": "Summer Music Festival",
                    "date": "2026-07-15T18:00:00.000Z"
                },
                "quantity": 2,
                "totalPrice": 100,
                "status": "confirmed",
                "createdAt": "2026-04-07T10:00:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 10,
            "totalBookings": 100,
            "limit": 10
        }
    }
}
```

---

### 2. Get All Users (Admin Only)

**GET** `/api/admin/users`

**Description:** Get all registered users (requires admin role)

**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Query Parameters:**

| Parameter | Type   | Required | Description                     |
| --------- | ------ | -------- | ------------------------------- |
| `page`    | Number | No       | Page number (default: 1)        |
| `limit`   | Number | No       | Items per page (default: 10)    |
| `role`    | String | No       | Filter by role: `user`, `admin` |

**Success Response (200):**

```json
{
    "success": true,
    "message": "Users retrieved successfully",
    "data": {
        "users": [
            {
                "_id": "507f1f77bcf86cd799439012",
                "name": "John Doe",
                "email": "john@example.com",
                "role": "user",
                "createdAt": "2026-04-01T10:00:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 2,
            "totalUsers": 15,
            "limit": 10
        }
    }
}
```

---

## 📊 Query Parameters Reference

### Pagination

All list endpoints support pagination:

```
GET /api/events?page=2&limit=20
```

**Default Values:**

- `page`: 1
- `limit`: 10
- Maximum `limit`: 100

---

### Search

Text search in specified fields:

```
GET /api/events?search=music festival
```

**Searchable Fields (Events):**

- `title`
- `description`

---

### Filtering

Filter results by various criteria:

```
GET /api/events?category=concert&location=New York&minPrice=20&maxPrice=100
```

**Available Filters by Resource:**

**Events:**

- `category`: Exact match
- `location`: Partial match
- `minPrice`, `maxPrice`: Price range
- `startDate`, `endDate`: Date range
- `createdBy`: User ID

**Bookings:**

- `status`: Exact match (confirmed, pending, cancelled)
- `eventId`: Event ID
- `userId`: User ID

---

### Sorting

Sort results by field and order:

```
GET /api/events?sort=date&order=desc
GET /api/events?sort=price,-date  (multiple fields)
```

**Sortable Fields:**

**Events:**

- `title`
- `date`
- `price`
- `createdAt`

**Bookings:**

- `totalPrice`
- `status`
- `createdAt`

---

## 📝 Response Format

### Success Response Structure

```json
{
    "success": true,
    "message": "Descriptive success message",
    "data": {}
}
```

### Error Response Structure

```json
{
    "success": false,
    "message": "Descriptive error message",
    "errors": []
}
```

### Pagination Structure

```json
{
    "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalItems": 50,
        "limit": 10
    }
}
```

---

## ⚠️ Error Codes

| HTTP Status | Meaning               | Example                                 |
| ----------- | --------------------- | --------------------------------------- |
| 200         | OK                    | Successful GET, PUT, PATCH, DELETE      |
| 201         | Created               | Successful POST (resource created)      |
| 400         | Bad Request           | Validation error, invalid input         |
| 401         | Unauthorized          | Missing or invalid JWT token            |
| 403         | Forbidden             | Insufficient permissions                |
| 404         | Not Found             | Resource doesn't exist                  |
| 409         | Conflict              | Duplicate resource (e.g., email exists) |
| 429         | Too Many Requests     | Rate limit exceeded                     |
| 500         | Internal Server Error | Server-side error                       |

---

## 🔑 Authentication

All protected endpoints require JWT authentication:

**Header Format:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to Get Token:**

1. Register or login via `/api/auth/register` or `/api/auth/login`
2. Receive token in response
3. Include token in subsequent requests

---

## 🎯 Role-Based Access

| Endpoint                 | User          | Admin    |
| ------------------------ | ------------- | -------- |
| GET /api/events          | ✅            | ✅       |
| POST /api/events         | ❌            | ✅       |
| PUT /api/events/:id      | ❌            | ✅       |
| DELETE /api/events/:id   | ❌            | ✅       |
| GET /api/bookings        | ✅ (own only) | ✅ (all) |
| POST /api/bookings       | ✅            | ✅       |
| DELETE /api/bookings/:id | ✅ (own only) | ✅ (any) |
| GET /api/admin/\*        | ❌            | ✅       |

---

## 📌 Notes

- All dates use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- All IDs are MongoDB ObjectIds
- Passwords are never returned in responses
- All timestamps are in UTC

---

_Last Updated: April 2026_
