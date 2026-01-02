import { describe, it, expect } from "vitest";
import { BreachDetails } from "@domain/value/BreachDetails";
import { Alert } from "@domain/Alert";
import { AlertStatus } from "@domain/value/AlertStatus";
import * as AlertMapper from "@storage/AlertMapper";
import { AlertDocument } from "@storage/AlertSchema";

describe("AlertMapper", () => {
  const createEntity = () => {
    const details = new BreachDetails(
      "t-1",
      "High electricity usage",
      "Electricity",
      "ACTUAL",
      "",
      2.2,
      2.5,
    );
    return Alert.create(details);
  };

  describe("toPersistence", () => {
    it("should flatten Entity VOs into Mongoose primitives with correct data", () => {
      const entity = createEntity();
      entity.markAsFailed("Test Error");

      const doc = AlertMapper.toPersistence(entity);

      expect(doc._id).toBe(entity.id.value);
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.createdAt).toBe(entity.createdAt);
      expect(doc.status).toBe(AlertStatus.FAILED);
      expect(doc.failReason).toBe("Test Error");

      expect(doc.details?.thresholdId).toBe("t-1");
      expect(doc.details?.thresholdName).toBe("High electricity usage");
      expect(doc.details?.periodType).toBe("");
      expect(doc.details?.limitValue).toBe(2.2);
      expect(doc.details?.detectedValue).toBe(2.5);
    });
  });

  describe("toDomain", () => {
    it("should reconstruct Entity with correct VOs from Document", () => {
      const now = new Date();
      const doc: AlertDocument = {
        _id: "uuid-123",
        status: AlertStatus.SENT,
        createdAt: now,
        sentAt: now,
        failReason: undefined,
        details: {
          thresholdId: "t-1",
          thresholdName: "High electricity usage",
          utilityType: "Electricity",
          thresholdType: "ACTUAL",
          periodType: "",
          limitValue: 2.2,
          detectedValue: 2.5,
        },
      };

      const entity = AlertMapper.toDomain(doc);

      expect(entity.id.value).toBe("uuid-123");
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.createdAt).toStrictEqual(now);
      expect(entity.status).toBe(AlertStatus.SENT);

      expect(entity.details.thresholdId).toBe("t-1");
      expect(entity.details.detectedValue).toBe(2.5);
      expect(entity.details.periodType).toBe("");
    });
  });
});
