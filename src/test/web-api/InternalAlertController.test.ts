import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, mockAlertService, mockSseSender } from "./helpers";
import { AlertId } from "@domain/value/AlertId";

const app = createTestApp();

describe("Internal API Integration (InternalAlertController)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /internal - should create alert and return 201", async () => {
    const validPayload = {
      thresholdId: "th-2",
      thresholdName: "Test",
      utilityType: "GAS",
      thresholdType: "ACTUAL",
      periodType: "",
      limitValue: 10,
      detectedValue: 13,
    };

    const fakeId = AlertId.of("new-id-th-2");
    mockAlertService.createAndSend.mockResolvedValue(fakeId);

    const res = await request(app).post("/internal").send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe("new-id-th-2");
  });

  it("GET /internal/stream - should add client to SSE", async () => {
    const res = await request(app).get("/internal/stream");
    expect(res.status).toBe(200);
    expect(mockSseSender.addClient).toHaveBeenCalled();
  });
});
