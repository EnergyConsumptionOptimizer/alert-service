export const DomainErrorCode = {
	NOTIFICATION_ID_EMPTY: "NOTIFICATION_ID_EMPTY",
	NOTIFICATION_MESSAGE_EMPTY: "NOTIFICATION_MESSAGE_EMPTY",
} as const;

export type NotificationIdErrorCode =
	typeof DomainErrorCode.NOTIFICATION_ID_EMPTY;
export type NotificationMessageErrorCode =
	typeof DomainErrorCode.NOTIFICATION_MESSAGE_EMPTY;

export abstract class DomainError extends Error {
	public abstract readonly code: string;
	protected constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export class InvalidNotificationIdError extends DomainError {
	constructor(
		public readonly code: NotificationIdErrorCode,
		message: string,
	) {
		super(message);
	}
}

export class InvalidNotificationMessageError extends DomainError {
	constructor(
		public readonly code: NotificationMessageErrorCode,
		message: string,
	) {
		super(message);
	}
}
