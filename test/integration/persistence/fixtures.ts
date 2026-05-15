import type { NotificationState } from "@domain/value/NotificationState";
import { NotificationStates } from "@domain/value/NotificationState";
import { NotificationModel } from "@infrastructure/persistence/mongo/NotificationSchema";
import {
	aNewNotification,
	aNotification,
	validId,
	validMessage,
	validSourceId,
} from "@test/domainFactories";

export {
	aNewNotification,
	aNotification,
	validId,
	validMessage,
	validSourceId,
};

export async function seedNotification(
	id: string,
	sourceId: string,
	message: string,
	state: NotificationState = NotificationStates.PENDING,
): Promise<void> {
	await NotificationModel.create({
		_id: id,
		sourceId,
		message,
		state,
		createdAt: new Date("2025-01-01"),
		sentAt:
			(state as string) === NotificationStates.SENT
				? new Date("2025-01-02")
				: undefined,
		failedReason:
			(state as string) === NotificationStates.FAILED
				? "Network error"
				: undefined,
		readAt: undefined,
	});
}
