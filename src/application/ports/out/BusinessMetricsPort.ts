export interface BusinessMetricsPort {
	recordNotificationCreation(): void;
	recordNotificationSent(): void;
	recordNotificationFailed(): void;
	recordNotificationSuppression(): void;
	recordNotificationMarkedRead(): void;
	recordNotificationDeletion(): void;
}
