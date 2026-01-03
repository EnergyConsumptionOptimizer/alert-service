import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BreachDetails } from "@domain/value/BreachDetails";
import { Alert } from "@domain/Alert";
import { AlertId } from "@domain/value/AlertId";
import { AlertStatus } from "@domain/value/AlertStatus";

describe("Alert", () => {
  const mockDetails = {
    getFormattedMessage: vi.fn().mockReturnValue("Formatted Msg"),
  } as unknown as BreachDetails;

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe("Factory: create", () => {
    it("should initialize a Pending alert with current timestamp and unread status", () => {
      const now = new Date("2026-01-01T10:00:00.000Z");
      vi.setSystemTime(now);

      const alert = Alert.create(mockDetails);

      expect(alert.id).toBeInstanceOf(AlertId);
      expect(alert.status).toBe(AlertStatus.PENDING);
      expect(alert.createdAt).toStrictEqual(now);
      expect(alert.sentAt).toBeUndefined();
      expect(alert.readAt).toBeUndefined();
      expect(alert.isRead).toBe(false);
    });
  });

  describe("Factory: restore", () => {
    it("should hydrate an alert from persistence data including readAt", () => {
      const id = AlertId.create();
      const createdStr = "2026-05-20T10:00:00.000Z";
      const sentDate = new Date("2026-05-20T10:05:00.000Z");
      const readDate = new Date("2026-05-20T12:00:00.000Z");

      const alert = Alert.restore(
        id,
        mockDetails,
        createdStr,
        AlertStatus.SENT,
        sentDate,
        undefined,
        readDate,
      );

      expect(alert.id).toBe(id);
      expect(alert.createdAt).toStrictEqual(new Date(createdStr));
      expect(alert.sentAt).toStrictEqual(sentDate);
      expect(alert.readAt).toStrictEqual(readDate);
      expect(alert.isRead).toBe(true);
    });
  });

  describe("Business Logic: markAsSent", () => {
    it("should transition to SENT and capture sentAt time", () => {
      const alert = Alert.create(mockDetails);

      const sentTime = new Date("2026-01-01T11:00:00.000Z");
      vi.setSystemTime(sentTime);

      alert.markAsSent();

      expect(alert.status).toBe(AlertStatus.SENT);
      expect(alert.sentAt).toStrictEqual(sentTime);
    });

    it("should be idempotent (ignore calls if already SENT)", () => {
      const alert = Alert.create(mockDetails);

      vi.setSystemTime(new Date("2026-01-01T11:00:00.000Z"));
      alert.markAsSent();
      const originalSentAt = alert.sentAt;

      vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
      alert.markAsSent();

      expect(alert.sentAt).toStrictEqual(originalSentAt);
    });
  });

  describe("Business Logic: markAsFailed", () => {
    it("should transition to FAILED and record the reason", () => {
      const alert = Alert.create(mockDetails);
      const reason = "mocked reason";

      alert.markAsFailed(reason);

      expect(alert.status).toBe(AlertStatus.FAILED);
      expect(alert.failReason).toBe(reason);
    });
  });

  describe("Business Logic: markAsRead", () => {
    it("should set readAt timestamp when marked as read", () => {
      const alert = Alert.create(mockDetails);
      const readTime = new Date("2026-01-01T15:00:00.000Z");
      vi.setSystemTime(readTime);

      alert.markAsRead();

      expect(alert.readAt).toStrictEqual(readTime);
      expect(alert.isRead).toBe(true);
    });

    it("should be idempotent (not update timestamp if already read)", () => {
      const alert = Alert.create(mockDetails);

      vi.setSystemTime(new Date("2026-01-01T15:00:00.000Z"));
      alert.markAsRead();
      const originalReadAt = alert.readAt;

      vi.setSystemTime(new Date("2026-01-01T16:00:00.000Z"));
      alert.markAsRead();

      expect(alert.readAt).toStrictEqual(originalReadAt);
    });
  });
});
