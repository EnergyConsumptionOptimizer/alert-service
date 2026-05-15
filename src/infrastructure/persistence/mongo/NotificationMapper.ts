import { Notification } from "@domain/entity/Notification";
import { NotificationId } from "@domain/value/NotificationId";
import { NotificationMessage } from "@domain/value/NotificationMessage";
import type { NotificationState } from "@domain/value/NotificationState";
import type { NotificationDoc } from "@infrastructure/persistence/mongo/NotificationSchema";

interface PersistenceNotification {
	_id: string;
	sourceId: string;
	message: string;
	state: string;
	createdAt: Date;
	sentAt?: Date;
	failedReason?: string;
	readAt?: Date;
}

export function toDomain(doc: NotificationDoc): Notification {
	const id = NotificationId.of(doc._id);
	if (id instanceof Error) {
		throw new Error(
			`Corrupt database record: invalid NotificationId for ${doc._id}`,
		);
	}

	const message = NotificationMessage.of(doc.message);
	if (message instanceof Error) {
		throw new Error(
			`Corrupt database record: invalid NotificationMessage for ${doc._id}`,
		);
	}

	return Notification.restore(
		id,
		doc.sourceId,
		message,
		doc.createdAt,
		doc.state as NotificationState,
		doc.sentAt ?? undefined,
		doc.failedReason ?? undefined,
		doc.readAt ?? undefined,
	);
}

export function toPersistence(
	notification: Notification,
): PersistenceNotification {
	return {
		_id: notification.id.value,
		sourceId: notification.sourceId,
		message: notification.message.value,
		state: notification.state,
		createdAt: notification.createdAt,
		sentAt: notification.sentAt,
		failedReason: notification.failedReason,
		readAt: notification.readAt,
	};
}
