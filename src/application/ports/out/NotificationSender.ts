import type { Notification } from "@domain/entity/Notification";

export interface NotificationSender {
	send(notification: Notification): Promise<void>;
}
