import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

const mockEventSave = jest.fn();
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndDelete = jest.fn();

const EventMock = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: "507f1f77bcf86cd799439020",
    save: mockEventSave,
}));

EventMock.find = mockFind;
EventMock.countDocuments = mockCountDocuments;
EventMock.findById = mockFindById;
EventMock.findByIdAndDelete = mockFindByIdAndDelete;

await jest.unstable_mockModule("../../src/models/Event.js", () => ({
    default: EventMock,
}));

await jest.unstable_mockModule("../../src/middlewares/authMiddleware.js", () => ({
    protect: (req, _res, next) => {
        req.user = { id: "507f1f77bcf86cd799439099", role: "admin" };
        next();
    },
    authorize: () => (_req, _res, next) => next(),
    optionalAuth: (_req, _res, next) => next(),
}));

const { default: app } = await import("../../src/app.js");

beforeEach(() => {
    jest.clearAllMocks();
    mockEventSave.mockResolvedValue();
});

describe("Event API", () => {
    describe("GET /api/events", () => {
        it("returns paginated public event list", async () => {
            const events = [
                {
                    _id: "507f1f77bcf86cd799439031",
                    title: "Music Festival",
                    description: "Great music event",
                    category: "concert",
                },
            ];

            const queryBuilder = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(events),
            };

            mockFind.mockReturnValue(queryBuilder);
            mockCountDocuments.mockResolvedValue(1);

            const res = await request(app).get("/api/events?page=1&limit=10");

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Events retrieved successfully");
            expect(res.body.data.events).toHaveLength(1);
            expect(res.body.data.pagination.totalEvents).toBe(1);
            expect(mockFind).toHaveBeenCalledTimes(1);
            expect(mockCountDocuments).toHaveBeenCalledTimes(1);
        });
    });

    describe("GET /api/events/:id", () => {
        it("returns a single public event by id", async () => {
            const event = {
                _id: "507f1f77bcf86cd799439032",
                title: "Tech Conference",
                createdBy: { _id: "507f1f77bcf86cd799439099", name: "Admin" },
            };

            mockFindById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(event),
            });

            const res = await request(app).get("/api/events/507f1f77bcf86cd799439032");

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Event retrieved successfully");
            expect(res.body.data).toHaveProperty("_id", event._id);
            expect(mockFindById).toHaveBeenCalledWith("507f1f77bcf86cd799439032");
        });
    });

    describe("POST /api/events", () => {
        it("creates a new event as admin", async () => {
            mockFindById.mockResolvedValue(null);

            const payload = {
                title: "Admin Created Event",
                description: "Created by admin",
                date: "2030-08-15T18:00:00.000Z",
                location: "Cairo",
                category: "conference",
                capacity: 200,
                price: 99,
            };

            const res = await request(app).post("/api/events").send(payload);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Event created successfully");
            expect(EventMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: payload.title,
                    createdBy: "507f1f77bcf86cd799439099",
                }),
            );
            expect(mockEventSave).toHaveBeenCalledTimes(1);
        });
    });

    describe("PUT /api/events/:id", () => {
        it("updates an existing event as admin", async () => {
            const existingEvent = {
                _id: "507f1f77bcf86cd799439033",
                title: "Old Title",
                description: "Old Description",
                location: "Old Location",
                save: jest.fn().mockResolvedValue(),
            };

            mockFindById.mockResolvedValue(existingEvent);

            const res = await request(app)
                .put("/api/events/507f1f77bcf86cd799439033")
                .send({
                    title: "New Title",
                    location: "New Location",
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Event updated successfully");
            expect(existingEvent.title).toBe("New Title");
            expect(existingEvent.location).toBe("New Location");
            expect(existingEvent.save).toHaveBeenCalledTimes(1);
        });
    });

    describe("DELETE /api/events/:id", () => {
        it("deletes an existing event as admin", async () => {
            mockFindByIdAndDelete.mockResolvedValue({
                _id: "507f1f77bcf86cd799439034",
            });

            const res = await request(app).delete("/api/events/507f1f77bcf86cd799439034");

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Event deleted successfully");
            expect(mockFindByIdAndDelete).toHaveBeenCalledWith(
                "507f1f77bcf86cd799439034",
            );
        });
    });
});
