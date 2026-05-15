import { InboxEventModel } from "@infrastructure/persistence/mongo/InboxEventSchema";
import { MongoInboxRepository } from "@infrastructure/persistence/mongo/MongoInboxRepository";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/persistence/mongo/InboxEventSchema", () => ({
	InboxEventModel: {
		create: vi.fn(),
	},
}));

describe("MongoInboxRepository", () => {
	let repository: MongoInboxRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		repository = new MongoInboxRepository();
	});

	describe("tryAcquire()", () => {
		it("should return true when event is not yet processed", async () => {
			vi.mocked(InboxEventModel.create).mockResolvedValue({
				eventId: "evt-1",
			} as never);

			const result = await repository.tryAcquire("evt-1");

			expect(result).toBe(true);
			expect(InboxEventModel.create).toHaveBeenCalledWith({
				eventId: "evt-1",
				timestamp: expect.any(Date) as Date,
			});
		});

		it("should return false on duplicate key error", async () => {
			vi.mocked(InboxEventModel.create).mockRejectedValue(
				new mongoose.mongo.MongoServerError({
					code: 11000,
					message: "duplicate key",
				}),
			);

			const result = await repository.tryAcquire("evt-1");

			expect(result).toBe(false);
		});

		it("should rethrow unexpected errors", async () => {
			const dbError = new Error("connection lost");
			vi.mocked(InboxEventModel.create).mockRejectedValue(dbError);

			await expect(repository.tryAcquire("evt-1")).rejects.toThrow(
				"connection lost",
			);
		});
	});
});
