import { InboxEventModel } from "@infrastructure/persistence/mongo/InboxEventSchema";
import { MongoInboxRepository } from "@infrastructure/persistence/mongo/MongoInboxRepository";
import { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("MongoInboxRepository (integration)", () => {
	let repository: MongoInboxRepository;

	beforeAll(async () => {
		await startMongo();
		repository = new MongoInboxRepository();
		await InboxEventModel.createCollection();
	});

	afterAll(async () => {
		await stopMongo();
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	describe("tryAcquire()", () => {
		it("returns true when the event has not been seen before", async () => {
			const result = await repository.tryAcquire("new-event-1");

			expect(result).toBe(true);
		});

		it("returns false when the event has already been processed", async () => {
			await InboxEventModel.create({
				eventId: "existing-event",
				timestamp: new Date(),
			});

			const result = await repository.tryAcquire("existing-event");

			expect(result).toBe(false);
		});

		it("persists the event in the inbox collection", async () => {
			await repository.tryAcquire("persisted-event");

			const doc = await InboxEventModel.findOne({
				eventId: "persisted-event",
			})
				.lean()
				.exec();

			expect(doc).not.toBeNull();
			if (!doc) return;
			expect(doc.eventId).toBe("persisted-event");
			expect(doc.timestamp).toBeInstanceOf(Date);
		});
	});
});
