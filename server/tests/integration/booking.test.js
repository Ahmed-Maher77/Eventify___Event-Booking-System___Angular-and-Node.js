import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

const DEFAULT_USER_ID = "507f1f77bcf86cd799439011";
const DEFAULT_EVENT_ID = "507f1f77bcf86cd799439021";

const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();

const BookingMock = {
    find: mockFind,
    countDocuments: mockCountDocuments,
    findById: mockFindById,
    create: mockCreate,
};

const mockEventFindById = jest.fn();
const EventMock = {
    findById: mockEventFindById,
};

await jest.unstable_mockModule("../../src/models/Booking.js", () => ({
    default: BookingMock,
}));

await jest.unstable_mockModule("../../src/models/Event.js", () => ({
    default: EventMock,
}));

await jest.unstable_mockModule("../../src/middlewares/authMiddleware.js", () => ({
    protect: (req, _res, next) => {
        const userId = req.headers["x-test-user-id"] || DEFAULT_USER_ID;
        const role = req.headers["x-test-role"] || "user";
        req.user = { id: userId, _id: userId, role };
        next();
    },
    authorize: (...roles) => (req, _res, next) => {
        const allowed = roles.flat();
        if (!allowed.includes(req.user.role)) {
            const err = new Error("Not authorized to access this route");
            err.statusCode = 403;
            err.isOperational = true;
            return next(err);
        }
        next();
    },
    optionalAuth: (_req, _res, next) => next(),
}));

const { default: app } = await import("../../src/app.js");

const createFindChain = (result) => {
    const chain = {
        populate: jest.fn(() => chain),
        skip: jest.fn(() => chain),
        limit: jest.fn().mockResolvedValue(result),
    };
    return chain;
};

const createFindByIdChain = (result) => {
    const chain = {
        populate: jest.fn(() => chain),
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
        catch: (reject) => Promise.resolve(result).catch(reject),
    };
    return chain;
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Booking API", () => {
    describe("GET /api/bookings", () => {
        it("returns current user's bookings with pagination", async () => {
            const bookings = [{ _id: "507f1f77bcf86cd799439100", status: "pending" }];
            mockFind.mockReturnValue(createFindChain(bookings));
            mockCountDocuments.mockResolvedValue(1);

            const res = await request(app)
                .get("/api/bookings?page=1&limit=10")
                .set("x-test-user-id", DEFAULT_USER_ID);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Bookings retrieved successfully");
            expect(res.body.data.bookings).toHaveLength(1);
            expect(mockFind).toHaveBeenCalledWith({ userId: DEFAULT_USER_ID });
        });
    });

    describe("GET /api/bookings/:id", () => {
        it("returns a single booking", async () => {
            const booking = {
                _id: "507f1f77bcf86cd799439101",
                userId: { _id: DEFAULT_USER_ID, name: "User" },
                eventId: { _id: DEFAULT_EVENT_ID, title: "Event" },
            };

            mockFindById.mockReturnValue(createFindByIdChain(booking));

            const res = await request(app).get("/api/bookings/507f1f77bcf86cd799439101");

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Booking retrieved successfully");
            expect(res.body.data).toHaveProperty("_id", booking._id);
        });
    });

    describe("POST /api/bookings", () => {
        it("creates a booking and decrements event available seats", async () => {
            const event = {
                _id: DEFAULT_EVENT_ID,
                availableSeats: 10,
                price: 50,
                save: jest.fn().mockResolvedValue(),
            };

            const booking = {
                _id: "507f1f77bcf86cd799439102",
                userId: DEFAULT_USER_ID,
                eventId: DEFAULT_EVENT_ID,
                quantity: 2,
                totalPrice: 100,
                populate: jest.fn().mockResolvedValue(),
            };

            mockEventFindById.mockResolvedValue(event);
            mockCreate.mockResolvedValue(booking);

            const res = await request(app).post("/api/bookings").send({
                eventId: DEFAULT_EVENT_ID,
                quantity: 2,
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Booking created successfully");
            expect(mockCreate).toHaveBeenCalledWith({
                userId: DEFAULT_USER_ID,
                eventId: DEFAULT_EVENT_ID,
                quantity: 2,
                totalPrice: 100,
            });
            expect(event.availableSeats).toBe(8);
            expect(event.save).toHaveBeenCalledTimes(1);
        });
    });

    describe("PATCH /api/bookings/:id", () => {
        it("updates booking status as admin", async () => {
            const booking = {
                _id: "507f1f77bcf86cd799439103",
                status: "pending",
                save: jest.fn().mockResolvedValue(),
            };

            mockFindById.mockReturnValue(createFindByIdChain(booking));

            const res = await request(app)
                .patch("/api/bookings/507f1f77bcf86cd799439103")
                .set("x-test-role", "admin")
                .send({ status: "confirmed" });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Booking status updated successfully");
            expect(booking.status).toBe("confirmed");
            expect(booking.save).toHaveBeenCalledTimes(1);
        });

        it("returns 403 for non-admin users", async () => {
            const res = await request(app)
                .patch("/api/bookings/507f1f77bcf86cd799439103")
                .set("x-test-role", "user")
                .send({ status: "confirmed" });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Not authorized to access this route");
        });
    });

    describe("DELETE /api/bookings/:id", () => {
        it("cancels an owned booking", async () => {
            const booking = {
                _id: "507f1f77bcf86cd799439104",
                userId: { _id: DEFAULT_USER_ID },
                eventId: DEFAULT_EVENT_ID,
                quantity: 2,
                status: "pending",
                save: jest.fn().mockResolvedValue(),
            };

            const event = {
                _id: DEFAULT_EVENT_ID,
                availableSeats: 5,
                save: jest.fn().mockResolvedValue(),
            };

            mockFindById.mockReturnValue(createFindByIdChain(booking));
            mockEventFindById.mockResolvedValue(event);

            const res = await request(app)
                .delete("/api/bookings/507f1f77bcf86cd799439104")
                .set("x-test-user-id", DEFAULT_USER_ID);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Booking cancelled successfully");
            expect(booking.status).toBe("cancelled");
            expect(event.availableSeats).toBe(7);
            expect(booking.save).toHaveBeenCalledTimes(1);
            expect(event.save).toHaveBeenCalledTimes(1);
        });
    });

    describe("GET /api/admin/bookings", () => {
        it("returns all bookings for admin", async () => {
            const bookings = [{ _id: "507f1f77bcf86cd799439105", status: "confirmed" }];
            mockFind.mockReturnValue(createFindChain(bookings));
            mockCountDocuments.mockResolvedValue(1);

            const res = await request(app)
                .get("/api/admin/bookings?page=1&limit=10")
                .set("x-test-role", "admin");

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("All bookings retrieved successfully");
            expect(res.body.data.bookings).toHaveLength(1);
            expect(mockFind).toHaveBeenCalledWith({});
        });
    });
});
