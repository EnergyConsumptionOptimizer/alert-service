import type { NotificationSender } from "@application/ports/out/NotificationSender";
import type { Notification } from "@domain/entity/Notification";
import type { SseRegistry } from "@infrastructure/sse/SseRegistry";

export class SseNotificationSender implements NotificationSender {
	readonly #sseRegistry: SseRegistry;

	constructor(sseRegistry: SseRegistry) {
		this.#sseRegistry = sseRegistry;
	}

	async send(notification: Notification): Promise<void> {
		this.#sseRegistry.broadcast({
			type: "NEW_NOTIFICATION",
			payload: {
				id: notification.id.value,
				sourceId: notification.sourceId,
				message: notification.message.value,
				state: notification.state,
				createdAt: notification.createdAt.toISOString(),
			},
		});
	}
}
