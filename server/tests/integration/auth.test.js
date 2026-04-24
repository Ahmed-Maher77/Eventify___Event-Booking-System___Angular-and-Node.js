import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

const mockSave = jest.fn();
const mockFindOne = jest.fn();

const UserMock = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: "507f1f77bcf86cd799439011",
    role: data.role ?? "user",
    save: mockSave,
}));

UserMock.findOne = mockFindOne;

await jest.unstable_mockModule("../../src/models/User.js", () => ({
    default: UserMock,
}));

const { default: app } = await import("../../src/app.js");

beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue();
});

describe("Auth API", () => {
    describe("POST /api/auth/register", () => {
        it("creates a new user and returns token", async () => {
            mockFindOne.mockResolvedValue(null);

            const payload = {
                name: "Test User",
                email: "test.user@example.com",
                password: "Passw0rd!",
            };

            const res = await request(app).post("/api/auth/register").send(payload);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("User registered successfully");
            expect(res.body).toHaveProperty("token");
            expect(res.body.data).toHaveProperty("email", payload.email);
            expect(mockSave).toHaveBeenCalledTimes(1);
        });

        it("returns 400 when required fields are missing", async () => {
            mockFindOne.mockResolvedValue(null);

            const res = await request(app).post("/api/auth/register").send({
                email: "incomplete@example.com",
            });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/required/i);
        });
    });

    describe("POST /api/auth/login", () => {
        it("logs in an existing user and returns token", async () => {
            const user = {
                _id: "507f1f77bcf86cd799439012",
                role: "user",
                email: "login.user@example.com",
                comparePassword: jest.fn().mockResolvedValue(true),
            };

            mockFindOne.mockResolvedValue(user);

            const res = await request(app).post("/api/auth/login").send({
                email: user.email,
                password: "Passw0rd!",
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Login successful");
            expect(res.body).toHaveProperty("token");
            expect(res.body.data).toHaveProperty("email", user.email);
            expect(user.comparePassword).toHaveBeenCalledWith("Passw0rd!");
        });

        it("returns 401 for invalid credentials", async () => {
            const user = {
                _id: "507f1f77bcf86cd799439013",
                role: "user",
                email: "invalid.login@example.com",
                comparePassword: jest.fn().mockResolvedValue(false),
            };

            mockFindOne.mockResolvedValue(user);

            const res = await request(app).post("/api/auth/login").send({
                email: user.email,
                password: "WrongPass1!",
            });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("invalid email or password");
        });
    });
});
