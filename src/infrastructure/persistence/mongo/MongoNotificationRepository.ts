import type { Notification } from "@domain/entity/Notification";
import type { NotificationRepository } from "@domain/ports/NotificationRepository";
import type { NotificationId } from "@domain/value/NotificationId";
import { mongoSessionContext } from "@infrastructure/persistence/mongo/mongoSessionContext";
import {
	toDomain,
	toPersistence,
} from "@infrastructure/persistence/mongo/NotificationMapper";
import { NotificationModel } from "@infrastructure/persistence/mongo/NotificationSchema";
import type { Logger } from "pino";

export class MongoNotificationRepository implements NotificationRepository {
	readonly #logger?: Logger;

	constructor(logger?: Logger) {
		this.#logger = logger;
	}

	async findById(id: NotificationId): Promise<Notification | undefined> {
		const doc = await NotificationModel.findById(id.value).lean().exec();
		return doc ? toDomain(doc) : undefined;
	}

	async findAll(): Promise<Notification[]> {
		const docs = await NotificationModel.find()
			.sort({ createdAt: -1 })
			.lean()
			.exec();
		return docs.map(toDomain);
	}

	async countUnread(): Promise<number> {
		return NotificationModel.countDocuments({
			$or: [{ readAt: null }, { readAt: { $exists: false } }],
		}).exec();
	}

	async existsRecentUnread(sourceId: string, since: Date): Promise<boolean> {
		const count = await NotificationModel.countDocuments({
			sourceId,
			createdAt: { $gte: since },
			$or: [{ readAt: null }, { readAt: { $exists: false } }],
		}).exec();
		return count > 0;
	}

	async save(notification: Notification): Promise<void> {
		const raw = toPersistence(notification);
		const session = mongoSessionContext.getStore();

		try {
			await NotificationModel.replaceOne({ _id: raw._id }, raw, {
				upsert: true,
				runValidators: true,
				session,
			}).exec();
		} catch (err) {
			this.#logger?.error(
				{ notificationId: notification.id.value, err },
				"Database error on save",
			);
			throw err;
		}
	}

	async remove(notification: Notification): Promise<void> {
		const session = mongoSessionContext.getStore();
		try {
			await NotificationModel.findByIdAndDelete(notification.id.value, {
				session,
			}).exec();
		} catch (err) {
			this.#logger?.error(
				{ notificationId: notification.id.value, err },
				"Database error on remove",
			);
			throw err;
		}
	}

	async removeAll(): Promise<void> {
		const session = mongoSessionContext.getStore();
		try {
			await NotificationModel.deleteMany({}, { session }).exec();
		} catch (err) {
			this.#logger?.error({ err }, "Database error on removeAll");
			throw err;
		}
	}
}
