import { Notification } from "@domain/entity/Notification";
import { NotificationStates } from "@domain/value/NotificationState";
import {
	toDomain,
	toPersistence,
} from "@infrastructure/persistence/mongo/NotificationMapper";
import type { NotificationDoc } from "@infrastructure/persistence/mongo/NotificationSchema";
import {
	aNewNotification,
	aNotification,
	validId,
} from "@test/domainFactories";
import { describe, expect, it } from "vitest";

describe("NotificationMapper", () => {
	describe("toDomain()", () => {
		it("should map a persistence document to a domain Notification", () => {
			const doc: NotificationDoc = {
				_id: "notif-1",
				sourceId: "source-1",
				message: "Something happened",
				state: NotificationStates.SENT,
				createdAt: new Date("2025-01-01"),
				sentAt: new Date("2025-01-02"),
				failedReason: undefined,
				readAt: undefined,
			};

			const result = toDomain(doc);

			expect(result).toBeInstanceOf(Notification);
			expect(result.id.value).toBe("notif-1");
			expect(result.sourceId).toBe("source-1");
			expect(result.message.value).toBe("Something happened");
			expect(result.state).toBe(NotificationStates.SENT);
			expect(result.sentAt).toEqual(new Date("2025-01-02"));
		});

		it("should map a FAILED document with failedReason", () => {
			const doc: NotificationDoc = {
				_id: "notif-1",
				sourceId: "source-1",
				message: "Something happened",
				state: NotificationStates.FAILED,
				createdAt: new Date("2025-01-01"),
				failedReason: "Network error",
			};

			const result = toDomain(doc);

			expect(result.state).toBe(NotificationStates.FAILED);
			expect(result.failedReason).toBe("Network error");
		});

		it("should map a read notification with readAt", () => {
			const doc: NotificationDoc = {
				_id: "notif-1",
				sourceId: "source-1",
				message: "Something happened",
				state: NotificationStates.SENT,
				createdAt: new Date("2025-01-01"),
				sentAt: new Date("2025-01-02"),
				readAt: new Date("2025-01-03"),
			};

			const result = toDomain(doc);

			expect(result.isRead).toBe(true);
			expect(result.readAt).toEqual(new Date("2025-01-03"));
		});
	});

	describe("toPersistence()", () => {
		it("should map a domain Notification to a persistence document", () => {
			const notification = aNewNotification({
				id: validId("notif-1"),
				sourceId: "source-1",
			});

			const result = toPersistence(notification);

			expect(result._id).toBe("notif-1");
			expect(result.sourceId).toBe("source-1");
			expect(result.state).toBe(NotificationStates.PENDING);
			expect(result.createdAt).toBeInstanceOf(Date);
		});

		it("should include optional fields when present", () => {
			const notification = aNotification({
				id: validId("notif-1"),
				state: NotificationStates.FAILED,
				failedReason: "Network error",
				sentAt: new Date("2025-01-02"),
			});

			const result = toPersistence(notification);

			expect(result.state).toBe(NotificationStates.FAILED);
			expect(result.failedReason).toBe("Network error");
		});

		it("should include readAt when notification has been read", () => {
			const notification = aNotification({
				id: validId("notif-1"),
				state: NotificationStates.SENT,
				readAt: new Date("2025-01-03"),
			});

			const result = toPersistence(notification);

			expect(result.readAt).toEqual(new Date("2025-01-03"));
		});
	});
});
