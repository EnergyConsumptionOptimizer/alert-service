import { DomainErrorCode, InvalidNotificationIdError } from "@domain/errors";

export class NotificationId {
	private constructor(readonly value: string) {}

	static of(id: string): NotificationId | InvalidNotificationIdError {
		const trimmed = id.trim();
		if (!trimmed) {
			return new InvalidNotificationIdError(
				DomainErrorCode.NOTIFICATION_ID_EMPTY,
				"Notification ID must not be empty",
			);
		}
		return new NotificationId(trimmed);
	}

	equals(other: NotificationId): boolean {
		return this.value === other.value;
	}
}
