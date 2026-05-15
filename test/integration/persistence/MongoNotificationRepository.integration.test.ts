import { Notification } from "@domain/entity/Notification";
import { NotificationStates } from "@domain/value/NotificationState";
import { MongoNotificationRepository } from "@infrastructure/persistence/mongo/MongoNotificationRepository";
import { NotificationModel } from "@infrastructure/persistence/mongo/NotificationSchema";
import {
	aNewNotification,
	aNotification,
	seedNotification,
	validId,
	validSourceId,
} from "@test/integration/persistence/fixtures";
import { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("MongoNotificationRepository (integration)", () => {
	let repository: MongoNotificationRepository;

	beforeAll(async () => {
		await startMongo();
		repository = new MongoNotificationRepository();
		await NotificationModel.createCollection();
	});

	afterAll(async () => {
		await stopMongo();
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	describe("findById()", () => {
		it("returns a domain Notification when the document exists", async () => {
			await seedNotification("notif-1", "source-1", "Something happened");

			const result = await repository.findById(validId("notif-1"));

			expect(result).toBeInstanceOf(Notification);
			if (!result) return;
			expect(result.id.value).toBe("notif-1");
			expect(result.sourceId).toBe("source-1");
			expect(result.message.value).toBe("Something happened");
			expect(result.state).toBe(NotificationStates.PENDING);
		});

		it("returns undefined when the document does not exist", async () => {
			const result = await repository.findById(validId("unknown-id"));

			expect(result).toBeUndefined();
		});
	});

	describe("findAll()", () => {
		it("returns all notifications sorted by createdAt desc", async () => {
			await seedNotification("notif-1", "source-1", "First");
			await seedNotification(
				"notif-2",
				"source-2",
				"Second",
				NotificationStates.SENT,
			);

			const result = await repository.findAll();

			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(Notification);
		});

		it("returns an empty array when no notifications exist", async () => {
			const result = await repository.findAll();

			expect(result).toEqual([]);
		});
	});

	describe("countUnread()", () => {
		it("returns the number of unread notifications", async () => {
			await seedNotification("notif-1", "source-1", "Unread");
			await seedNotification(
				"notif-2",
				"source-2",
				"Read",
				NotificationStates.SENT,
			);

			await NotificationModel.findByIdAndUpdate("notif-2", {
				readAt: new Date(),
			}).exec();

			const result = await repository.countUnread();

			expect(result).toBe(1);
		});
	});

	describe("existsRecentUnread()", () => {
		it("returns true when recent unread exists for the source", async () => {
			await seedNotification("notif-1", "source-1", "Unread");

			const result = await repository.existsRecentUnread(
				"source-1",
				new Date("2024-01-01"),
			);

			expect(result).toBe(true);
		});

		it("returns false when no recent unread exists", async () => {
			await seedNotification(
				"notif-1",
				"source-1",
				"Read",
				NotificationStates.SENT,
			);
			await NotificationModel.findByIdAndUpdate("notif-1", {
				readAt: new Date(),
			}).exec();

			const result = await repository.existsRecentUnread(
				"source-1",
				new Date("2024-01-01"),
			);

			expect(result).toBe(false);
		});

		it("returns false when source has no notifications", async () => {
			const result = await repository.existsRecentUnread(
				"source-1",
				new Date("2024-01-01"),
			);

			expect(result).toBe(false);
		});
	});

	describe("save()", () => {
		it("creates a new notification document", async () => {
			const notification = aNewNotification({
				id: validId("new-notif"),
				sourceId: validSourceId("source-1"),
			});

			await repository.save(notification);

			const doc = await NotificationModel.findById("new-notif").lean().exec();
			expect(doc).not.toBeNull();
			if (!doc) return;
			expect(doc.sourceId).toBe("source-1");
			expect(doc.state).toBe(NotificationStates.PENDING);
		});

		it("updates an existing notification document", async () => {
			await seedNotification("notif-1", "source-1", "Old message");
			const notification = aNotification({
				id: validId("notif-1"),
				state: NotificationStates.SENT,
				sentAt: new Date("2025-01-02"),
			});

			await repository.save(notification);

			const doc = await NotificationModel.findById("notif-1").lean().exec();
			if (!doc) return;
			expect(doc.state).toBe(NotificationStates.SENT);
		});
	});

	describe("remove()", () => {
		it("deletes the notification document", async () => {
			await seedNotification("notif-1", "source-1", "Something");

			await repository.remove(aNotification({ id: validId("notif-1") }));

			const doc = await NotificationModel.findById("notif-1").lean().exec();
			expect(doc).toBeNull();
		});
	});

	describe("removeAll()", () => {
		it("deletes all notification documents", async () => {
			await seedNotification("notif-1", "source-1", "First");
			await seedNotification("notif-2", "source-2", "Second");

			await repository.removeAll();

			const count = await NotificationModel.countDocuments().exec();
			expect(count).toBe(0);
		});
	});
});
