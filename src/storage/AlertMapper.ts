import { BreachDetails } from "@domain/value/BreachDetails";
import { AlertId } from "@domain/value/AlertId";
import { AlertStatus } from "@domain/value/AlertStatus";
import { Alert } from "@domain/Alert";
import { AlertDocument } from "./AlertSchema";

export function toPersistence(entity: Alert): AlertDocument {
  return {
    _id: entity.id.value,
    status: entity.status,
    createdAt: entity.createdAt,
    sentAt: entity.sentAt,
    failReason: entity.failReason,
    details: {
      thresholdId: entity.details.thresholdId,
      thresholdName: entity.details.thresholdName,
      utilityType: entity.details.utilityType,
      thresholdType: entity.details.thresholdType,
      periodType: entity.details.periodType,
      limitValue: entity.details.limitValue,
      detectedValue: entity.details.detectedValue,
    },
  } as AlertDocument;
}

export function toDomain(doc: AlertDocument): Alert {
  if (!doc.details) {
    throw new Error(
      `Data Integrity Error: Alert ${doc._id} is missing details`,
    );
  }

  const details = new BreachDetails(
    doc.details.thresholdId,
    doc.details.thresholdName,
    doc.details.utilityType,
    doc.details.thresholdType,
    doc.details.periodType,
    doc.details.limitValue,
    doc.details.detectedValue,
  );

  return Alert.restore(
    AlertId.of(doc._id),
    details,
    new Date(doc.createdAt),
    doc.status as AlertStatus,
    doc.sentAt ? new Date(doc.sentAt) : undefined,
    doc.failReason ?? undefined,
  );
}
