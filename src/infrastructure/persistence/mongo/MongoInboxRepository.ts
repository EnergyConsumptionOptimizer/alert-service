import type { InboxRepository } from "@infrastructure/persistence/InboxRepository";
import mongoose from "mongoose";
import type { Logger } from "pino";
import { InboxEventModel } from "./InboxEventSchema";

export class MongoInboxRepository implements InboxRepository {
	readonly #logger?: Logger;

	constructor(logger?: Logger) {
		this.#logger = logger;
	}

	async tryAcquire(eventId: string): Promise<boolean> {
		try {
			await InboxEventModel.create({ eventId, timestamp: new Date() });
			this.#logger?.debug({ eventId }, "Inbox event acquired");
			return true;
		} catch (err: unknown) {
			if (
				err instanceof mongoose.mongo.MongoServerError &&
				err.code === 11000
			) {
				this.#logger?.debug({ eventId }, "Duplicate inbox event, skipped");
				return false;
			}
			this.#logger?.error({ eventId, err }, "Inbox repository error");
			throw err;
		}
	}
}
