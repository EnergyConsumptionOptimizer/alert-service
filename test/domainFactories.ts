import { Notification } from "@domain/entity/Notification";
import { NotificationId } from "@domain/value/NotificationId";
import { NotificationMessage } from "@domain/value/NotificationMessage";
import type { NotificationState } from "@domain/value/NotificationState";
import { NotificationStates } from "@domain/value/NotificationState";

export function validId(value = "notif-1"): NotificationId {
	return NotificationId.of(value) as NotificationId;
}

export function validSourceId(value = "source-1"): string {
	return value;
}

export function validMessage(
	value = "Something happened: value 150 exceeds limit 100",
): NotificationMessage {
	return NotificationMessage.of(value) as NotificationMessage;
}

export function aNewNotification(overrides?: {
	id?: NotificationId;
	sourceId?: string;
	message?: NotificationMessage;
}): Notification {
	return Notification.create(
		overrides?.id ?? validId(),
		overrides?.sourceId ?? validSourceId(),
		overrides?.message ?? validMessage(),
	);
}

export function aNotification(overrides?: {
	id?: NotificationId;
	sourceId?: string;
	message?: NotificationMessage;
	createdAt?: Date;
	state?: NotificationState;
	sentAt?: Date;
	failedReason?: string;
	readAt?: Date;
}): Notification {
	return Notification.restore(
		overrides?.id ?? validId(),
		overrides?.sourceId ?? validSourceId(),
		overrides?.message ?? validMessage(),
		overrides?.createdAt ?? new Date("2025-01-01"),
		overrides?.state ?? NotificationStates.PENDING,
		overrides?.sentAt,
		overrides?.failedReason,
		overrides?.readAt,
	);
}
