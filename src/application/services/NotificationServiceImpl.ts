import {
	NotificationNotFoundError,
	NotificationSuppressedError,
} from "@application/errors";
import type {
	CreateNotificationParams,
	CreateNotificationResponse,
	DeleteOneResponse,
	GetNotificationResponse,
	MarkAsReadResponse,
	NotificationOutput,
	NotificationService,
} from "@application/ports/in/NotificationService";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { IdGenerator } from "@application/ports/out/IdGenerator";
import type { NotificationSender } from "@application/ports/out/NotificationSender";
import { Notification } from "@domain/entity/Notification";
import type { NotificationRepository } from "@domain/ports/NotificationRepository";
import { NotificationId } from "@domain/value/NotificationId";
import { NotificationMessage } from "@domain/value/NotificationMessage";

export class NotificationServiceImpl implements NotificationService {
	readonly #repository: NotificationRepository;
	readonly #idGenerator: IdGenerator;
	readonly #sender: NotificationSender;
	readonly #metrics: BusinessMetricsPort;
	readonly #spamWindowMs: number;

	constructor(
		repository: NotificationRepository,
		idGenerator: IdGenerator,
		sender: NotificationSender,
		metrics: BusinessMetricsPort,
		spamWindowMs: number,
	) {
		this.#repository = repository;
		this.#idGenerator = idGenerator;
		this.#sender = sender;
		this.#metrics = metrics;
		this.#spamWindowMs = spamWindowMs;
	}

	async create(
		params: CreateNotificationParams,
	): Promise<CreateNotificationResponse> {
		const message = NotificationMessage.of(params.message);
		if (message instanceof Error) return message;

		const isSpam = await this.#repository.existsRecentUnread(
			params.sourceId,
			new Date(Date.now() - this.#spamWindowMs),
		);
		if (isSpam) {
			this.#metrics.recordNotificationSuppression();
			return new NotificationSuppressedError();
		}

		const id = NotificationId.of(this.#idGenerator.generate());
		if (id instanceof Error) return id;

		const notification = Notification.create(id, params.sourceId, message);

		this.#metrics.recordNotificationCreation();
		await this.#repository.save(notification);

		try {
			await this.#sender.send(notification);
			notification.markAsSent();
			this.#metrics.recordNotificationSent();
		} catch (err) {
			notification.markAsFailed(
				err instanceof Error ? err.message : "Unknown send error",
			);
			this.#metrics.recordNotificationFailed();
		}

		await this.#repository.save(notification);
		return toOutput(notification);
	}

	async getById(id: string): Promise<GetNotificationResponse> {
		const notificationId = NotificationId.of(id);
		if (notificationId instanceof Error) return notificationId;

		const notification = await this.#repository.findById(notificationId);
		if (!notification) return new NotificationNotFoundError(id);

		return toOutput(notification);
	}

	async getAll(): Promise<NotificationOutput[]> {
		const notifications = await this.#repository.findAll();
		return notifications.map(toOutput);
	}

	async getUnreadCount(): Promise<number> {
		return this.#repository.countUnread();
	}

	async markAsRead(id: string): Promise<MarkAsReadResponse> {
		const notificationId = NotificationId.of(id);
		if (notificationId instanceof Error) return notificationId;

		const notification = await this.#repository.findById(notificationId);
		if (!notification) return new NotificationNotFoundError(id);

		notification.markAsRead();
		await this.#repository.save(notification);
		this.#metrics.recordNotificationMarkedRead();
	}

	async deleteOne(id: string): Promise<DeleteOneResponse> {
		const notificationId = NotificationId.of(id);
		if (notificationId instanceof Error) return notificationId;

		const notification = await this.#repository.findById(notificationId);
		if (!notification) return new NotificationNotFoundError(id);

		await this.#repository.remove(notification);
		this.#metrics.recordNotificationDeletion();
	}

	async deleteAll(): Promise<void> {
		await this.#repository.removeAll();
		this.#metrics.recordNotificationDeletion();
	}
}

function toOutput(notification: Notification): NotificationOutput {
	return {
		id: notification.id.value,
		sourceId: notification.sourceId,
		message: notification.message.value,
		state: notification.state,
		createdAt: notification.createdAt.toISOString(),
		sentAt: notification.sentAt?.toISOString() ?? null,
		failedReason: notification.failedReason ?? null,
		readAt: notification.readAt?.toISOString() ?? null,
		isRead: notification.isRead,
	};
}
