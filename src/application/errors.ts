export const AppErrorCode = {
	NOTIFICATION_NOT_FOUND: "NOTIFICATION_NOT_FOUND",
	NOTIFICATION_SUPPRESSED: "NOTIFICATION_SUPPRESSED",
} as const;

export abstract class ApplicationError extends Error {
	public abstract readonly code: string;

	protected constructor(message: string) {
		super(message);
		this.name = this.constructor.name;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export class NotificationNotFoundError extends ApplicationError {
	public readonly code = AppErrorCode.NOTIFICATION_NOT_FOUND;

	constructor(id: string) {
		super(`Notification with id ${id} not found`);
	}
}

export class NotificationSuppressedError extends ApplicationError {
	public readonly code = AppErrorCode.NOTIFICATION_SUPPRESSED;

	constructor() {
		super("Notification suppressed by spam protection policy");
	}
}
