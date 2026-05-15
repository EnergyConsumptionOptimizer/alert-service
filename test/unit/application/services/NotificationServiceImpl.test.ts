import {
	NotificationNotFoundError,
	NotificationSuppressedError,
} from "@application/errors";
import type { NotificationService } from "@application/ports/in/NotificationService";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { IdGenerator } from "@application/ports/out/IdGenerator";
import type { NotificationSender } from "@application/ports/out/NotificationSender";
import { NotificationServiceImpl } from "@application/services/NotificationServiceImpl";
import type { Notification } from "@domain/entity/Notification";
import {
	InvalidNotificationIdError,
	InvalidNotificationMessageError,
} from "@domain/errors";
import type { NotificationRepository } from "@domain/ports/NotificationRepository";
import { NotificationStates } from "@domain/value/NotificationState";
import {
	aNewNotification,
	aNotification,
	validId,
} from "@test/domainFactories";
import type { MockProxy } from "vitest-mock-extended";
import { mock } from "vitest-mock-extended";

describe("NotificationServiceImpl", () => {
	let repository: MockProxy<NotificationRepository>;
	let idGenerator: MockProxy<IdGenerator>;
	let sender: MockProxy<NotificationSender>;
	let metrics: MockProxy<BusinessMetricsPort>;
	let service: NotificationService;

	const GENERATED_ID = "generated-notif-id";

	beforeEach(() => {
		repository = mock<NotificationRepository>();
		idGenerator = mock<IdGenerator>();
		sender = mock<NotificationSender>();
		metrics = mock<BusinessMetricsPort>();

		idGenerator.generate.mockReturnValue(GENERATED_ID);
		repository.existsRecentUnread.mockResolvedValue(false);
		sender.send.mockResolvedValue(undefined);

		service = new NotificationServiceImpl(
			repository,
			idGenerator,
			sender,
			metrics,
			3_600_000,
		);
	});

	describe("create()", () => {
		it("should create a notification, save it, notify via SSE, mark as sent, and record metrics", async () => {
			const savedStates: string[] = [];
			repository.save.mockImplementation(async (n: Notification) => {
				savedStates.push(n.state);
			});

			const result = await service.create({
				sourceId: "th-1",
				message: "Threshold breached: 150 exceeds 100",
			});

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;

			expect(result).toMatchObject({
				id: GENERATED_ID,
				sourceId: "th-1",
				message: "Threshold breached: 150 exceeds 100",
				state: NotificationStates.SENT,
				sentAt: expect.any(String) as unknown,
				isRead: false,
			});

			expect(savedStates).toEqual([
				NotificationStates.PENDING,
				NotificationStates.SENT,
			]);
			expect(sender.send).toHaveBeenCalledOnce();
			expect(metrics.recordNotificationCreation).toHaveBeenCalledOnce();
			expect(metrics.recordNotificationSent).toHaveBeenCalledOnce();
			expect(metrics.recordNotificationFailed).not.toHaveBeenCalled();
		});

		it("should mark notification as FAILED when SSE notify throws", async () => {
			const savedStates: string[] = [];
			repository.save.mockImplementation(async (n: Notification) => {
				savedStates.push(n.state);
			});
			sender.send.mockRejectedValue(new Error("SSE connection lost"));

			const result = await service.create({
				sourceId: "th-1",
				message: "Something happened",
			});

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;

			expect(result.state).toBe(NotificationStates.FAILED);
			expect(result.failedReason).toBe("SSE connection lost");
			expect(savedStates).toEqual([
				NotificationStates.PENDING,
				NotificationStates.FAILED,
			]);
			expect(metrics.recordNotificationCreation).toHaveBeenCalledOnce();
			expect(metrics.recordNotificationFailed).toHaveBeenCalledOnce();
			expect(metrics.recordNotificationSent).not.toHaveBeenCalled();
		});

		it("should record unknown send error when SSE fails without Error instance", async () => {
			repository.save.mockImplementation(async () => {});
			sender.send.mockRejectedValue("string error");

			const result = await service.create({
				sourceId: "th-1",
				message: "Something happened",
			});

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;

			expect(result.failedReason).toBe("Unknown send error");
		});

		it("should return InvalidNotificationMessageError when message is empty", async () => {
			const result = await service.create({
				sourceId: "th-1",
				message: "",
			});

			expect(result).toBeInstanceOf(InvalidNotificationMessageError);
			expect(repository.save).not.toHaveBeenCalled();
			expect(sender.send).not.toHaveBeenCalled();
		});

		it("should return InvalidNotificationIdError when ID generation fails", async () => {
			idGenerator.generate.mockReturnValue("   ");

			const result = await service.create({
				sourceId: "th-1",
				message: "Something happened",
			});

			expect(result).toBeInstanceOf(InvalidNotificationIdError);
		});

		it("should suppress notification when recent unread exists for same source", async () => {
			repository.existsRecentUnread.mockResolvedValue(true);

			const result = await service.create({
				sourceId: "th-1",
				message: "Another breach",
			});

			expect(result).toBeInstanceOf(NotificationSuppressedError);
			expect(repository.save).not.toHaveBeenCalled();
			expect(sender.send).not.toHaveBeenCalled();
			expect(metrics.recordNotificationSuppression).toHaveBeenCalledOnce();
			expect(metrics.recordNotificationCreation).not.toHaveBeenCalled();
		});
	});

	describe("getById()", () => {
		it("should return the notification output when found", async () => {
			const notification = aNotification({
				id: validId("notif-1"),
				state: NotificationStates.SENT,
				sentAt: new Date("2025-01-02"),
			});
			repository.findById.mockResolvedValue(notification);

			const result = await service.getById("notif-1");

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;

			expect(result).toMatchObject({
				id: "notif-1",
				state: NotificationStates.SENT,
			});
		});

		it("should return NotificationNotFoundError when not found", async () => {
			repository.findById.mockResolvedValue(undefined);

			const result = await service.getById("notif-1");

			expect(result).toBeInstanceOf(NotificationNotFoundError);
		});

		it("should return InvalidNotificationIdError for empty id", async () => {
			const result = await service.getById("");

			expect(result).toBeInstanceOf(InvalidNotificationIdError);
		});
	});

	describe("getAll()", () => {
		it("should return all notifications as output", async () => {
			const n1 = aNewNotification({ id: validId("id-1") });
			const n2 = aNotification({
				id: validId("id-2"),
				state: NotificationStates.FAILED,
				failedReason: "error",
			});
			repository.findAll.mockResolvedValue([n1, n2]);

			const result = await service.getAll();

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe("id-1");
			expect(result[1].id).toBe("id-2");
		});

		it("should return empty array when no notifications exist", async () => {
			repository.findAll.mockResolvedValue([]);

			const result = await service.getAll();

			expect(result).toEqual([]);
		});
	});

	describe("getUnreadCount()", () => {
		it("should delegate to repository countUnread", async () => {
			repository.countUnread.mockResolvedValue(5);

			const result = await service.getUnreadCount();

			expect(result).toBe(5);
			expect(repository.countUnread).toHaveBeenCalledOnce();
		});
	});

	describe("markAsRead()", () => {
		it("should mark notification as read and save", async () => {
			const notification = aNewNotification({ id: validId("notif-1") });
			repository.findById.mockResolvedValue(notification);

			const result = await service.markAsRead("notif-1");

			expect(result).toBeUndefined();
			expect(notification.isRead).toBe(true);
			expect(repository.save).toHaveBeenCalledOnce();
			expect(metrics.recordNotificationMarkedRead).toHaveBeenCalledOnce();
		});

		it("should return NotificationNotFoundError when not found", async () => {
			repository.findById.mockResolvedValue(undefined);

			const result = await service.markAsRead("notif-1");

			expect(result).toBeInstanceOf(NotificationNotFoundError);
		});

		it("should return InvalidNotificationIdError for empty id", async () => {
			const result = await service.markAsRead("");

			expect(result).toBeInstanceOf(InvalidNotificationIdError);
		});
	});

	describe("deleteOne()", () => {
		it("should remove notification when found", async () => {
			const notification = aNewNotification({ id: validId("notif-1") });
			repository.findById.mockResolvedValue(notification);

			const result = await service.deleteOne("notif-1");

			expect(result).toBeUndefined();
			expect(repository.remove).toHaveBeenCalledWith(notification);
			expect(metrics.recordNotificationDeletion).toHaveBeenCalledOnce();
		});

		it("should return NotificationNotFoundError when not found", async () => {
			repository.findById.mockResolvedValue(undefined);

			const result = await service.deleteOne("notif-1");

			expect(result).toBeInstanceOf(NotificationNotFoundError);
			expect(repository.remove).not.toHaveBeenCalled();
		});

		it("should return InvalidNotificationIdError for empty id", async () => {
			const result = await service.deleteOne("");

			expect(result).toBeInstanceOf(InvalidNotificationIdError);
		});
	});

	describe("deleteAll()", () => {
		it("should remove all notifications and record metrics", async () => {
			await service.deleteAll();

			expect(repository.removeAll).toHaveBeenCalledOnce();
			expect(metrics.recordNotificationDeletion).toHaveBeenCalledOnce();
		});
	});

	describe("read operations", () => {
		it("should return FAILED notifications with correct state", async () => {
			const notification = aNotification({
				id: validId("notif-1"),
				state: NotificationStates.FAILED,
				failedReason: "prev-error",
			});
			repository.findById.mockResolvedValue(notification);

			const result = await service.getById("notif-1");

			expect(result).not.toBeInstanceOf(Error);
			if (result instanceof Error) return;
			expect(result.state).toBe(NotificationStates.FAILED);
			expect(result.failedReason).toBe("prev-error");
		});
	});
});
