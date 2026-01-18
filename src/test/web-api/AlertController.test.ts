import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, mockAlertService, mockSseSender } from "./helpers";
import { AlertFactory } from "./factories";
import { AlertNotFoundError } from "@application/errors";

const app = createTestApp();

describe("Public API Integration (AlertController)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/alerts/:id", () => {
    it("should return 200 and the alert details", async () => {
      const alert = AlertFactory.createPending("abc-123");
      mockAlertService.getById.calledWith("abc-123").mockResolvedValue(alert);

      const res = await request(app).get("/api/alerts/abc-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("abc-123");
      expect(res.body.data.message).toContain("exceeded by");
    });

    it("should return 404 when alert does not exist", async () => {
      mockAlertService.getById.mockRejectedValue(new AlertNotFoundError("999"));

      const res = await request(app).get("/api/alerts/999");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Alert with id 999 not found");
    });
  });

  describe("GET /api/alerts", () => {
    it("should return 200 and a list of alerts", async () => {
      const alert1 = AlertFactory.createPending("id-1");
      const alert2 = AlertFactory.createPending("id-2");
      mockAlertService.getAll.mockResolvedValue([alert1, alert2]);

      const res = await request(app).get("/api/alerts");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].id).toBe("id-1");
    });

    it("should return 200 and an empty list if no alerts found", async () => {
      mockAlertService.getAll.mockResolvedValue([]);

      const res = await request(app).get("/api/alerts");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe("DELETE /api/alerts/:id", () => {
    it("should delete the specific alert and return success", async () => {
      const targetId = "abc-123";
      mockAlertService.deleteOne
        .calledWith(targetId)
        .mockResolvedValue(undefined);

      const res = await request(app).delete(`/api/alerts/${targetId}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(mockAlertService.deleteOne).toHaveBeenCalledWith(targetId);
    });
  });

  describe("DELETE /api/alerts/", () => {
    it("should delete all alerts and return success", async () => {
      mockAlertService.deleteAll.mockResolvedValue(undefined);

      const res = await request(app).delete("/api/alerts/");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(mockAlertService.deleteAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/alerts/unread-count", () => {
    it("should return the count of unread alerts", async () => {
      mockAlertService.getUnreadCount.mockResolvedValue(5);

      const res = await request(app).get("/api/alerts/unread-count");

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(5);
      expect(mockAlertService.getUnreadCount).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/alerts/:id", () => {
    it("should mark alert as read and return 204", async () => {
      const targetId = "abc-123";
      mockAlertService.markAsRead
        .calledWith(targetId)
        .mockResolvedValue(undefined);

      const res = await request(app)
        .patch(`/api/alerts/${targetId}`)
        .send({ read: true });

      expect(res.status).toBe(204);
      expect(mockAlertService.markAsRead).toHaveBeenCalledWith(targetId);
    });

    it("should return 404 if alert to mark read is not found", async () => {
      const targetId = "missing-id";
      mockAlertService.markAsRead
        .calledWith(targetId)
        .mockRejectedValue(new AlertNotFoundError(targetId));

      const res = await request(app).patch(`/api/alerts/${targetId}/read`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/alerts/stream", () => {
    it("should add client to SSE", async () => {
      const res = await request(app).get("/api/alerts/stream");
      expect(res.status).toBe(200);
      expect(mockSseSender.addClient).toHaveBeenCalled();
    });
  });
});
