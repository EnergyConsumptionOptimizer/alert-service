import { Notification } from "@domain/entity/Notification";
import { NotificationStates } from "@domain/value/NotificationState";
import {
	aNewNotification,
	aNotification,
	validId,
	validMessage,
	validSourceId,
} from "@test/domainFactories";

describe("Notification Entity", () => {
	describe("create()", () => {
		it("should create a notification with PENDING state", () => {
			const id = validId();
			const sourceId = validSourceId("th-1");
			const message = validMessage();

			const notification = Notification.create(id, sourceId, message);

			expect(notification).toBeInstanceOf(Notification);
			expect(notification.id).toBe(id);
			expect(notification.sourceId).toBe("th-1");
			expect(notification.message).toBe(message);
			expect(notification.state).toBe(NotificationStates.PENDING);
			expect(notification.createdAt).toBeInstanceOf(Date);
			expect(notification.sentAt).toBeUndefined();
			expect(notification.failedReason).toBeUndefined();
			expect(notification.readAt).toBeUndefined();
			expect(notification.isRead).toBe(false);
		});
	});

	describe("restore()", () => {
		it("should restore a notification from persisted state", () => {
			const result = Notification.restore(
				validId(),
				validSourceId(),
				validMessage(),
				new Date("2025-01-01"),
				NotificationStates.SENT,
				new Date("2025-01-02"),
			);

			expect(result).toBeInstanceOf(Notification);
			expect(result.state).toBe(NotificationStates.SENT);
			expect(result.sentAt).toEqual(new Date("2025-01-02"));
		});

		it("should restore a failed notification with reason", () => {
			const result = Notification.restore(
				validId(),
				validSourceId(),
				validMessage(),
				new Date("2025-01-01"),
				NotificationStates.FAILED,
				undefined,
				"Network error",
			);

			expect(result.state).toBe(NotificationStates.FAILED);
			expect(result.failedReason).toBe("Network error");
		});

		it("should restore a read notification", () => {
			const result = Notification.restore(
				validId(),
				validSourceId(),
				validMessage(),
				new Date("2025-01-01"),
				NotificationStates.SENT,
				new Date("2025-01-02"),
				undefined,
				new Date("2025-01-03"),
			);

			expect(result.isRead).toBe(true);
			expect(result.readAt).toEqual(new Date("2025-01-03"));
		});
	});

	describe("markAsSent()", () => {
		it("should transition from PENDING to SENT", () => {
			const notification = aNewNotification();

			notification.markAsSent();

			expect(notification.state).toBe(NotificationStates.SENT);
			expect(notification.sentAt).toBeInstanceOf(Date);
		});

		it("should overwrite when already SENT", () => {
			const notification = aNotification({
				state: NotificationStates.SENT,
				sentAt: new Date("2025-01-02"),
			});

			notification.markAsSent();

			expect(notification.state).toBe(NotificationStates.SENT);
			expect(notification.sentAt).not.toEqual(new Date("2025-01-02"));
		});

		it("should overwrite when already FAILED", () => {
			const notification = aNotification({
				state: NotificationStates.FAILED,
				failedReason: "old",
			});

			notification.markAsSent();

			expect(notification.state).toBe(NotificationStates.SENT);
			expect(notification.sentAt).toBeInstanceOf(Date);
		});
	});

	describe("markAsFailed()", () => {
		it("should transition from PENDING to FAILED", () => {
			const notification = aNewNotification();

			notification.markAsFailed("Network error");

			expect(notification.state).toBe(NotificationStates.FAILED);
			expect(notification.failedReason).toBe("Network error");
		});

		it("should overwrite when already SENT", () => {
			const notification = aNotification({
				state: NotificationStates.SENT,
			});

			notification.markAsFailed("reason");

			expect(notification.state).toBe(NotificationStates.FAILED);
			expect(notification.failedReason).toBe("reason");
		});

		it("should overwrite when already FAILED", () => {
			const notification = aNotification({
				state: NotificationStates.FAILED,
				failedReason: "first",
			});

			notification.markAsFailed("second");

			expect(notification.state).toBe(NotificationStates.FAILED);
			expect(notification.failedReason).toBe("second");
		});
	});

	describe("markAsRead()", () => {
		it("should set readAt when not yet read", () => {
			const notification = aNewNotification();

			notification.markAsRead();

			expect(notification.isRead).toBe(true);
			expect(notification.readAt).toBeInstanceOf(Date);
		});

		it("should be idempotent on already read notifications", () => {
			const readDate = new Date("2025-01-02");
			const notification = aNotification({ readAt: readDate });

			notification.markAsRead();

			expect(notification.readAt).toEqual(readDate);
		});

		it("should allow marking a FAILED notification as read", () => {
			const notification = aNotification({
				state: NotificationStates.FAILED,
				failedReason: "error",
			});

			notification.markAsRead();

			expect(notification.isRead).toBe(true);
		});
	});

	describe("equals()", () => {
		it("should return true for notifications with the same id", () => {
			const id = validId();
			const n1 = Notification.create(
				id,
				validSourceId("src-a"),
				validMessage(),
			);
			const n2 = Notification.restore(
				id,
				validSourceId("src-b"),
				validMessage(),
				new Date(),
				NotificationStates.FAILED,
			);

			expect(n1.equals(n2)).toBe(true);
		});

		it("should return false for notifications with different ids", () => {
			const n1 = Notification.create(
				validId("id-1"),
				validSourceId(),
				validMessage(),
			);
			const n2 = Notification.create(
				validId("id-2"),
				validSourceId(),
				validMessage(),
			);

			expect(n1.equals(n2)).toBe(false);
		});
	});
});
