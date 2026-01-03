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
    it("should flatten Entity VOs into Mongoose primitives including readAt", () => {
      const entity = createEntity();
      entity.markAsRead();

      const doc = AlertMapper.toPersistence(entity);

      expect(doc._id).toBe(entity.id.value);
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.readAt).toBeInstanceOf(Date);
      expect(doc.readAt).toBe(entity.readAt);

      expect(doc.details?.thresholdId).toBe("t-1");
      expect(doc.details?.detectedValue).toBe(2.5);
    });
  });

  describe("toDomain", () => {
    it("should reconstruct Entity with correct VOs including readAt", () => {
      const now = new Date();
      const readDate = new Date();

      const doc: AlertDocument = {
        _id: "uuid-123",
        status: AlertStatus.SENT,
        createdAt: now,
        sentAt: now,
        readAt: readDate,
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
      expect(entity.createdAt).toStrictEqual(now);
      expect(entity.readAt).toStrictEqual(readDate);
      expect(entity.isRead).toBe(true);
      expect(entity.status).toBe(AlertStatus.SENT);
    });
  });
});
