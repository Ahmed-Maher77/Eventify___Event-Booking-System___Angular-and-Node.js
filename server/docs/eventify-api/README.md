# Eventify API - Bruno Collection

This is a [Bruno](https://www.usebruno.com/) API collection for the Eventify API. Bruno stores API collections directly in your filesystem, making it Git-friendly and perfect for version control alongside your code.

## Structure

```
eventify-api/
├── opencollection.yml              # Collection root (REQUIRED)
├── collection.yml                  # Collection-level settings
├── .gitignore                      # Git ignore file
├── environments/                  # Environment configurations
│   ├── Local.yml                  # Local development (localhost:3000)
│   └── Production.yml             # Production deployment
├── Auth/                          # Authentication endpoints
│   ├── folder.yml                 # Folder settings
│   ├── Register User.yml          # POST /api/auth/register
│   └── Login User.yml             # POST /api/auth/login
├── Events/                         # Event management endpoints
│   ├── folder.yml                 # Folder settings
│   ├── GetAllEvents.yml           # GET /api/events
│   ├── GetEvent.yml               # GET /api/events/:id
│   ├── CreateEvent.yml            # POST /api/events (admin)
│   ├── UpdateEvent.yml            # PUT /api/events/:id (admin)
│   └── DeleteEvent.yml            # DELETE /api/events/:id (admin)
├── Booking/                        # Booking management endpoints
│   ├── folder.yml                 # Folder settings
│   ├── Get User Bookings.yml      # GET /api/bookings
│   ├── Get Single Booking.yml     # GET /api/bookings/:id
│   ├── Create Booking.yml         # POST /api/bookings
│   ├── Update Booking Status.yml   # PATCH /api/bookings/:id (admin)
│   └── Cancel Booking.yml          # DELETE /api/bookings/:id
└── Admin/                          # Admin management endpoints
   ├── folder.yml                 # Folder settings
   └── Get All Bookings.yml       # GET /api/admin/bookings
```

## Getting Started

### Prerequisites
1. Install [Bruno](https://www.usebruno.com/downloads) (v3.1 or later)
2. Ensure the Eventify API is running

### Import the Collection

1. Open Bruno
2. Click **"Import Collection"**
3. Select the `eventify-api` folder
4. Bruno will automatically recognize the `opencollection.yml` file

### Configure Environment

1. Select the **Local** environment from the environment dropdown
2. Update environment variables as needed:
   - `baseUrl`: Your API base URL (default: `http://localhost:3000`)
   - `adminEmail`: Admin account email for testing
   - `adminPassword`: Admin account password for testing

## Usage

### Quick Start Workflow

1. **Register a User** (or use existing admin credentials)
   - Run `Register User` to create a new account
   - The token is automatically saved to the environment

2. **Login** (if you have existing credentials)
   - Set `adminEmail` and `adminPassword` in environment
   - Run `Login User`
   - Token is automatically saved for subsequent requests

3. **Create an Event** (requires admin token)
   - Run `CreateEvent` - requires authentication
   - Event ID is automatically saved

4. **View Events**
   - Run `GetAllEvents` to see all events
   - Run `GetEvent` to view a specific event

5. **Book Events**
   - Run `Create Booking` after selecting an `eventId`
   - Run `Get User Bookings` or `Get Single Booking` to inspect saved bookings

6. **Update/Delete Events** (requires admin token)
   - Run `UpdateEvent` or `DeleteEvent`

7. **Manage Booking Status** (requires admin token)
   - Run `Get All Bookings` or `Update Booking Status`

### Environment Variables

The collection uses several environment variables:

| Variable        | Description              | Default                 |
| --------------- | ------------------------ | ----------------------- |
| `baseUrl`       | API base URL             | `http://localhost:3000` |
| `adminEmail`    | Admin email for login    | (empty)                 |
| `adminPassword` | Admin password for login | (empty)                 |
| `authToken`     | JWT token (auto-saved)   | (empty)                 |
| `eventId`       | Event ID (auto-saved)    | (empty)                 |
| `bookingId`     | Booking ID (auto-saved)  | (empty)                 |
| `userId`        | User ID (auto-saved)     | (empty)                 |

### Authentication Flow

The collection handles authentication automatically:

1. Login request saves the token to `{{authToken}}`
2. Authenticated requests use `{{authToken}}` for Bearer authentication
3. Token is automatically attached to requests in the Events, Booking, and Admin folders

## Running with Bruno CLI

You can also run the collection using Bruno CLI:

```bash
# Install Bruno CLI
npm install -g @usebruno/cli

# Run all tests with Local environment
bru run --env Local

# Run specific folder
bru run --env Local --folder "Auth"
bru run --env Local --folder "Events"
bru run --env Local --folder "Booking"
bru run --env Local --folder "Admin"

# Generate HTML report
bru run --env Local --reporter-html results.html

# Run with custom working directory
cd docs/eventify-api
bru run --env Local
```

## Testing

Each request includes built-in tests and assertions:

- **Status code validation**
- **Response structure validation**
- **Field presence validation**
- **Response time validation**

Run tests to validate API responses:
```bash
bru run --env Local --tests
```

## Features

### ✨ Automated Token Management
- Login automatically saves the JWT token
- Token is reused for authenticated endpoints
- No manual token copying needed

### 🔄 Request Chaining
- Create event saves the event ID
- Subsequent requests can use the saved ID
- Chain requests in sequence

### 🧪 Built-in Tests
- Every request has test assertions
- Validates response structure
- Checks for required fields

### 📝 Comprehensive Documentation
- Each endpoint has detailed documentation
- Request/response examples
- Field descriptions and constraints

## Tips

1. **Start with Local environment** - Update credentials as needed
2. **Run requests in order** - Auth first, then events, then bookings
3. **Use variables** - Don't hardcode values, use `{{variables}}`
4. **Check tests tab** - See test results after each request
5. **Git commit** - Collection changes are tracked in Git

## Troubleshooting

### Token Not Found Error
- Run `Login User` first with valid credentials
- Ensure `adminEmail` and `adminPassword` are set in environment

### Event Not Found Error
- Run `GetAllEvents` or `CreateEvent` first
- Ensure `{{eventId}}` environment variable is set

### Booking Not Found Error
- Run `Create Booking`, `Get User Bookings`, or `Get All Bookings` first
- Ensure `{{bookingId}}` environment variable is set

### 403 Forbidden
- Ensure you're logged in with an **admin** account
- Regular users cannot access admin endpoints

## Contributing

Since this is a Git-tracked collection:

1. Make changes to requests
2. Commit alongside code changes
3. Create branches for new features
4. Review `.yml` changes in PRs

## Documentation

- [Bruno Documentation](https://docs.usebruno.com/)
- [OpenCollection Spec](https://spec.opencollection.com/)
- [Bruno CLI Documentation](https://docs.usebruno.com/cli)

## License

This collection is part of the Eventify project.
