import type {
	NotificationNotFoundError,
	NotificationSuppressedError,
} from "@application/errors";
import type {
	InvalidNotificationIdError,
	InvalidNotificationMessageError,
} from "@domain/errors";

export interface NotificationOutput {
	readonly id: string;
	readonly sourceId: string;
	readonly message: string;
	readonly state: string;
	readonly createdAt: string;
	readonly sentAt: string | null;
	readonly failedReason: string | null;
	readonly readAt: string | null;
	readonly isRead: boolean;
}

export interface CreateNotificationParams {
	readonly sourceId: string;
	readonly message: string;
}

export type CreateNotificationResponse =
	| NotificationOutput
	| InvalidNotificationIdError
	| InvalidNotificationMessageError
	| NotificationSuppressedError;

export type GetNotificationResponse =
	| NotificationOutput
	| NotificationNotFoundError
	| InvalidNotificationIdError;

export type MarkAsReadResponse =
	| undefined
	| NotificationNotFoundError
	| InvalidNotificationIdError;

export type DeleteOneResponse =
	| undefined
	| NotificationNotFoundError
	| InvalidNotificationIdError;

export interface NotificationService {
	create(params: CreateNotificationParams): Promise<CreateNotificationResponse>;
	getById(id: string): Promise<GetNotificationResponse>;
	getAll(): Promise<NotificationOutput[]>;
	getUnreadCount(): Promise<number>;
	markAsRead(id: string): Promise<MarkAsReadResponse>;
	deleteOne(id: string): Promise<DeleteOneResponse>;
	deleteAll(): Promise<void>;
}
