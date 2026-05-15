import {
	DomainErrorCode,
	InvalidNotificationMessageError,
} from "@domain/errors";

export class NotificationMessage {
	private constructor(readonly value: string) {}

	static of(
		message: string,
	): NotificationMessage | InvalidNotificationMessageError {
		const trimmed = message.trim();
		if (!trimmed) {
			return new InvalidNotificationMessageError(
				DomainErrorCode.NOTIFICATION_MESSAGE_EMPTY,
				"Notification message must not be empty",
			);
		}
		return new NotificationMessage(trimmed);
	}

	equals(other: NotificationMessage): boolean {
		return this.value === other.value;
	}
}
