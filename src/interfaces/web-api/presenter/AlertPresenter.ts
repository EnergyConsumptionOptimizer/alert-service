import { Alert } from "@domain/Alert";

/**
 * Converts a domain `Alert` into a transport-friendly response object.
 *
 * @param alert - The domain alert to convert.
 * @returns A plain object suitable for JSON responses.
 */
export function toResponse(alert: Alert) {
  return {
    id: alert.id.toString(),
    status: alert.status,
    message: alert.details.getFormattedMessage(),
    createdAt: alert.createdAt.toISOString(),
    sentAt: alert.sentAt?.toISOString() ?? null,
    failReason: alert.failReason ?? null,
    readAt: alert.readAt?.toISOString() ?? null,
    isRead: alert.isRead,
    details: {
      utility: alert.details.utilityType,
      limit: alert.details.limitValue,
      detected: alert.details.detectedValue,
      thresholdName: alert.details.thresholdName,
      periodType: alert.details.periodType,
    },
  };
}
