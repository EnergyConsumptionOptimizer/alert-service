import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, mockAlertService } from "./helpers";
import { AlertFactory } from "./factories";
import { AlertNotFoundError } from "@application/errors";

const app = createTestApp();

describe("Public API Integration (AlertController)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/:id - should return 200 and formatted JSON", async () => {
    const alert = AlertFactory.createPending("abc-123");
    mockAlertService.getById.calledWith("abc-123").mockResolvedValue(alert);

    const res = await request(app).get("/api/abc-123");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("abc-123");
    expect(res.body.data.message).toContain("exceeded by");
    expect(mockAlertService.getById).toHaveBeenCalledWith("abc-123");
  });

  it("GET /api/:id - should return 404 if not found", async () => {
    mockAlertService.getById.mockRejectedValue(new AlertNotFoundError("999"));
    const res = await request(app).get("/api/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Alert with id 999 not found");
  });
});
