import { describe, it, expect, vi, beforeEach } from "vitest";

import { AlertRepository } from "@domain/port/AlertRepository";
import { AlertSender } from "@application/port/AlertSender";
import { CreateAlertCommand } from "@application/port/CreateAlertCommand";
import { Alert } from "@domain/Alert";
import { AlertStatus } from "@domain/value/AlertStatus";
import { AlertId } from "@domain/value/AlertId";
import { AlertService } from "@application/AlertService";
import { AlertNotFoundError } from "@application/errors";

describe("AlertService", () => {
  const mockRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
  } as unknown as AlertRepository;

  const mockSender = {
    send: vi.fn(),
  } as unknown as AlertSender;

  const service = new AlertService(mockRepo, mockSender);

  const command: CreateAlertCommand = {
    thresholdId: "t-1",
    thresholdName: "High Voltage",
    utilityType: "Electricity",
    thresholdType: "MAX",
    periodType: "DAILY",
    limitValue: 220,
    detectedValue: 240,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAndSend", () => {
    it("should create, save, send, and update alert status to SENT", async () => {
      const resultId = await service.createAndSend(command);
      expect(resultId).toBeInstanceOf(AlertId);

      expect(mockSender.send).toHaveBeenCalledTimes(1);

      expect(mockRepo.save).toHaveBeenCalledTimes(2);

      const lastSavedAlert = vi.mocked(mockRepo.save).mock.calls[1][0] as Alert;
      expect(lastSavedAlert.status).toBe(AlertStatus.SENT);
    });

    it("should mark alert as FAILED if sending throws an error", async () => {
      const errorMsg = "SMTP Timeout";
      vi.mocked(mockSender.send).mockRejectedValueOnce(new Error(errorMsg));
      await service.createAndSend(command);
      expect(mockRepo.save).toHaveBeenCalledTimes(2);

      const lastSavedAlert = vi.mocked(mockRepo.save).mock.calls[1][0] as Alert;
      expect(lastSavedAlert.status).toBe(AlertStatus.FAILED);
      expect(lastSavedAlert.failReason).toBe(errorMsg);
    });
  });

  describe("getById", () => {
    it("should return the alert if found", async () => {
      const idString = "valid-uuid";
      const mockAlert = { id: { value: idString } } as unknown as Alert;

      vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockAlert);

      const result = await service.getById(idString);

      expect(result).toBe(mockAlert);
      expect(mockRepo.findById).toHaveBeenCalled();
    });

    it("should throw AlertNotFoundError if repository returns null", async () => {
      vi.mocked(mockRepo.findById).mockResolvedValueOnce(null);
      const validId = "valid-uuid-format";
      await expect(service.getById(validId)).rejects.toThrow(
        AlertNotFoundError,
      );
    });
  });

  describe("getAll", () => {
    it("should return all alerts from repository", async () => {
      const mockAlerts = [{}, {}] as Alert[];
      vi.mocked(mockRepo.findAll).mockResolvedValueOnce(mockAlerts);

      const result = await service.getAll();

      expect(result).toBe(mockAlerts);
      expect(mockRepo.findAll).toHaveBeenCalled();
    });
  });
});
