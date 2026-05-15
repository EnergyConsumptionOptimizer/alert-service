import type { NotificationId } from "@domain/value/NotificationId";
import type { NotificationMessage } from "@domain/value/NotificationMessage";
import {
	type NotificationState,
	NotificationStates,
} from "@domain/value/NotificationState";

export class Notification {
	readonly #sourceId: string;
	#message: NotificationMessage;
	#state: NotificationState;
	#sentAt?: Date;
	#failedReason?: string;
	#readAt?: Date;

	private constructor(
		public readonly id: NotificationId,
		sourceId: string,
		message: NotificationMessage,
		public readonly createdAt: Date,
		state: NotificationState,
		sentAt?: Date,
		failedReason?: string,
		readAt?: Date,
	) {
		this.#sourceId = sourceId;
		this.#message = message;
		this.#state = state;
		this.#sentAt = sentAt;
		this.#failedReason = failedReason;
		this.#readAt = readAt;
	}

	get sourceId(): string {
		return this.#sourceId;
	}
	get message(): NotificationMessage {
		return this.#message;
	}
	get state(): NotificationState {
		return this.#state;
	}
	get sentAt(): Date | undefined {
		return this.#sentAt;
	}
	get failedReason(): string | undefined {
		return this.#failedReason;
	}
	get readAt(): Date | undefined {
		return this.#readAt;
	}
	get isRead(): boolean {
		return this.#readAt !== undefined;
	}

	static create(
		id: NotificationId,
		sourceId: string,
		message: NotificationMessage,
	): Notification {
		return new Notification(
			id,
			sourceId,
			message,
			new Date(),
			NotificationStates.PENDING,
		);
	}

	static restore(
		id: NotificationId,
		sourceId: string,
		message: NotificationMessage,
		createdAt: Date,
		state: NotificationState,
		sentAt?: Date,
		failedReason?: string,
		readAt?: Date,
	): Notification {
		return new Notification(
			id,
			sourceId,
			message,
			createdAt,
			state,
			sentAt,
			failedReason,
			readAt,
		);
	}

	markAsSent(): void {
		this.#state = NotificationStates.SENT;
		this.#sentAt = new Date();
	}

	markAsFailed(reason: string): void {
		this.#state = NotificationStates.FAILED;
		this.#failedReason = reason;
	}

	markAsRead(): void {
		if (this.#readAt) {
			return;
		}
		this.#readAt = new Date();
	}

	equals(other: Notification): boolean {
		return this.id.equals(other.id);
	}
}
