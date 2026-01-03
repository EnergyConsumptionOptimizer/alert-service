import { describe, it, expect, beforeEach } from "vitest";
import { mock, mockReset } from "vitest-mock-extended";
import { AlertRepository } from "@domain/port/AlertRepository";
import { AlertSender } from "@application/port/AlertSender";
import { CreateAlertCommand } from "@application/port/CreateAlertCommand";
import { Alert } from "@domain/Alert";
import { AlertStatus } from "@domain/value/AlertStatus";
import { AlertId } from "@domain/value/AlertId";
import { AlertService } from "@application/AlertService";
import { AlertNotFoundError } from "@application/errors";

describe("AlertService", () => {
  const mockRepo = mock<AlertRepository>();
  const mockSender = mock<AlertSender>();

  const service = new AlertService(mockRepo, mockSender);

  const command: CreateAlertCommand = {
    thresholdId: "t-1",
    thresholdName: "High electricity usage",
    utilityType: "Electricity",
    thresholdType: "ACTUAL",
    periodType: "",
    limitValue: 2.2,
    detectedValue: 2.5,
  };

  beforeEach(() => {
    mockReset(mockRepo);
    mockReset(mockSender);
  });

  describe("createAndSend", () => {
    it("should create, save, send, and update alert status to SENT", async () => {
      const resultId = await service.createAndSend(command);

      expect(resultId).toBeInstanceOf(AlertId);
      expect(mockSender.send).toHaveBeenCalledTimes(1);

      expect(mockRepo.save).toHaveBeenCalledTimes(2);

      const lastSavedAlert = mockRepo.save.mock.calls[1][0];
      expect(lastSavedAlert.status).toBe(AlertStatus.SENT);
    });

    it("should mark alert as FAILED if sending throws an error", async () => {
      const errorMsg = "SMTP Timeout";
      mockSender.send.mockRejectedValue(new Error(errorMsg));

      await service.createAndSend(command);

      expect(mockRepo.save).toHaveBeenCalledTimes(2);

      const lastSavedAlert = mockRepo.save.mock.calls[1][0];
      expect(lastSavedAlert.status).toBe(AlertStatus.FAILED);
      expect(lastSavedAlert.failReason).toBe(errorMsg);
    });
  });

  describe("getById", () => {
    it("should return the alert if found", async () => {
      const idString = "valid-uuid";
      const mockAlert = { id: { value: idString } } as unknown as Alert;

      mockRepo.findById.mockResolvedValue(mockAlert);

      const result = await service.getById(idString);

      expect(result).toBe(mockAlert);
      expect(mockRepo.findById).toHaveBeenCalled();
    });

    it("should throw AlertNotFoundError if repository returns null", async () => {
      mockRepo.findById.mockResolvedValue(null);

      const validId = "valid-uuid-format";
      await expect(service.getById(validId)).rejects.toThrow(
        AlertNotFoundError,
      );
    });
  });

  describe("getAll", () => {
    it("should return all alerts from repository", async () => {
      const mockAlerts = [{}, {}] as Alert[];
      mockRepo.findAll.mockResolvedValue(mockAlerts);

      const result = await service.getAll();

      expect(result).toBe(mockAlerts);
    });
  });

  describe("deleteOne", () => {
    it("should delegate deletion to the repository with correct AlertId", async () => {
      const idString = "valid-uuid-to-delete";
      mockRepo.deleteOne.mockResolvedValue(undefined);

      await service.deleteOne(idString);

      expect(mockRepo.deleteOne).toHaveBeenCalledTimes(1);

      const calledArg = mockRepo.deleteOne.mock.calls[0][0];
      expect(calledArg).toBeInstanceOf(AlertId);
      expect(calledArg.value).toBe(idString);
    });
  });

  describe("deleteAll", () => {
    it("should delegate deleteAll to the repository", async () => {
      mockRepo.deleteAll.mockResolvedValue(undefined);

      await service.deleteAll();

      expect(mockRepo.deleteAll).toHaveBeenCalledTimes(1);
    });
  });
});
