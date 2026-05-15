import type { Notification } from "@domain/entity/Notification";
import type { NotificationId } from "@domain/value/NotificationId";

export interface NotificationRepository {
	findById(id: NotificationId): Promise<Notification | undefined>;
	findAll(): Promise<Notification[]>;
	countUnread(): Promise<number>;
	existsRecentUnread(sourceId: string, since: Date): Promise<boolean>;
	save(notification: Notification): Promise<void>;
	remove(notification: Notification): Promise<void>;
	removeAll(): Promise<void>;
}
