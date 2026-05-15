import { Notification } from "@domain/entity/Notification";
import { NotificationStates } from "@domain/value/NotificationState";
import { MongoNotificationRepository } from "@infrastructure/persistence/mongo/MongoNotificationRepository";
import { mongoSessionContext } from "@infrastructure/persistence/mongo/mongoSessionContext";
import {
	type NotificationDoc,
	NotificationModel,
} from "@infrastructure/persistence/mongo/NotificationSchema";
import { aNewNotification, validId } from "@test/domainFactories";
import type { ClientSession } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/persistence/mongo/NotificationSchema", () => ({
	NotificationModel: {
		findById: vi.fn(),
		find: vi.fn(),
		replaceOne: vi.fn(),
		findByIdAndDelete: vi.fn(),
		deleteMany: vi.fn(),
		countDocuments: vi.fn(),
	},
}));

vi.mock("@infrastructure/persistence/mongo/mongoSessionContext", () => ({
	mongoSessionContext: {
		getStore: vi.fn(),
	},
}));

function notificationDoc(
	overrides?: Partial<NotificationDoc>,
): NotificationDoc {
	return {
		_id: "notif-1",
		sourceId: "source-1",
		message: "Something happened",
		state: NotificationStates.PENDING,
		createdAt: new Date("2025-01-01"),
		...overrides,
	};
}

function mockExecChain(mockFn: ReturnType<typeof vi.fn>, returnValue: unknown) {
	mockFn.mockReturnValue({
		lean: vi.fn().mockReturnThis(),
		sort: vi.fn().mockReturnThis(),
		exec: vi.fn().mockResolvedValue(returnValue),
	});
}

describe("MongoNotificationRepository", () => {
	let repository: MongoNotificationRepository;
	let mockSession: ClientSession;

	beforeEach(() => {
		vi.clearAllMocks();
		repository = new MongoNotificationRepository();
		mockSession = { id: "test-session" } as unknown as ClientSession;
		vi.mocked(mongoSessionContext.getStore).mockReturnValue(mockSession);
	});

	describe("findById()", () => {
		it("should return a domain Notification when the document exists", async () => {
			const doc = notificationDoc({ _id: "notif-1" });
			mockExecChain(vi.mocked(NotificationModel.findById), doc);

			const result = await repository.findById(validId("notif-1"));

			expect(result).toBeInstanceOf(Notification);
			expect(result?.id.value).toBe("notif-1");
		});

		it("should return undefined when the document does not exist", async () => {
			mockExecChain(vi.mocked(NotificationModel.findById), null);

			const result = await repository.findById(validId("unknown-id"));

			expect(result).toBeUndefined();
		});
	});

	describe("findAll()", () => {
		it("should return all notifications sorted by createdAt desc", async () => {
			const docs = [
				notificationDoc({ _id: "notif-1" }),
				notificationDoc({
					_id: "notif-2",
					state: NotificationStates.SENT,
				}),
			];
			mockExecChain(vi.mocked(NotificationModel.find), docs);

			const result = await repository.findAll();

			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(Notification);
			expect(result[1].id.value).toBe("notif-2");
		});

		it("should return empty array when no notifications exist", async () => {
			mockExecChain(vi.mocked(NotificationModel.find), []);

			const result = await repository.findAll();

			expect(result).toEqual([]);
		});
	});

	describe("countUnread()", () => {
		it("should return the number of unread notifications", async () => {
			vi.mocked(NotificationModel.countDocuments).mockReturnValue({
				exec: vi.fn().mockResolvedValue(5),
			} as never);

			const result = await repository.countUnread();

			expect(result).toBe(5);
		});
	});

	describe("existsRecentUnread()", () => {
		it("should return true when recent unread exists", async () => {
			vi.mocked(NotificationModel.countDocuments).mockReturnValue({
				exec: vi.fn().mockResolvedValue(1),
			} as never);

			const result = await repository.existsRecentUnread(
				"source-1",
				new Date("2025-01-01"),
			);

			expect(result).toBe(true);
		});

		it("should return false when no recent unread exists", async () => {
			vi.mocked(NotificationModel.countDocuments).mockReturnValue({
				exec: vi.fn().mockResolvedValue(0),
			} as never);

			const result = await repository.existsRecentUnread(
				"source-1",
				new Date("2025-01-01"),
			);

			expect(result).toBe(false);
		});
	});

	describe("save()", () => {
		it("should upsert the notification document within the active session", async () => {
			vi.mocked(NotificationModel.replaceOne).mockReturnValue({
				exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
			} as never);
			const notification = aNewNotification();

			await repository.save(notification);

			expect(NotificationModel.replaceOne).toHaveBeenCalledWith(
				{ _id: "notif-1" },
				expect.objectContaining({
					_id: "notif-1",
					sourceId: "source-1",
				}),
				{ upsert: true, runValidators: true, session: mockSession },
			);
		});

		it("should rethrow unexpected database errors", async () => {
			const dbError = new Error("connection lost");
			vi.mocked(NotificationModel.replaceOne).mockReturnValue({
				exec: vi.fn().mockRejectedValue(dbError),
			} as never);

			await expect(repository.save(aNewNotification())).rejects.toThrow(
				"connection lost",
			);
		});
	});

	describe("remove()", () => {
		it("should delete the notification by id within the active session", async () => {
			vi.mocked(NotificationModel.findByIdAndDelete).mockReturnValue({
				exec: vi.fn().mockResolvedValue(undefined),
			} as never);
			const notification = aNewNotification({ id: validId("notif-1") });

			await repository.remove(notification);

			expect(NotificationModel.findByIdAndDelete).toHaveBeenCalledWith(
				"notif-1",
				{ session: mockSession },
			);
		});

		it("should rethrow database errors on remove", async () => {
			const dbError = new Error("delete failed");
			vi.mocked(NotificationModel.findByIdAndDelete).mockReturnValue({
				exec: vi.fn().mockRejectedValue(dbError),
			} as never);

			await expect(repository.remove(aNewNotification())).rejects.toThrow(
				"delete failed",
			);
		});
	});

	describe("removeAll()", () => {
		it("should delete all notifications within the active session", async () => {
			vi.mocked(NotificationModel.deleteMany).mockReturnValue({
				exec: vi.fn().mockResolvedValue({ deletedCount: 3 }),
			} as never);

			await repository.removeAll();

			expect(NotificationModel.deleteMany).toHaveBeenCalledWith(
				{},
				{ session: mockSession },
			);
		});

		it("should rethrow database errors on removeAll", async () => {
			const dbError = new Error("delete all failed");
			vi.mocked(NotificationModel.deleteMany).mockReturnValue({
				exec: vi.fn().mockRejectedValue(dbError),
			} as never);

			await expect(repository.removeAll()).rejects.toThrow("delete all failed");
		});
	});
});
