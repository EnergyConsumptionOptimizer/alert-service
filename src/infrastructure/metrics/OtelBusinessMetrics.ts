import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import {
	notificationCreationsTotal,
	notificationDeletionsTotal,
	notificationFailedTotal,
	notificationMarkedReadTotal,
	notificationSentTotal,
	notificationSuppressionsTotal,
} from "@infrastructure/metrics/businessMetrics";

export class OtelBusinessMetrics implements BusinessMetricsPort {
	recordNotificationCreation(): void {
		notificationCreationsTotal.add(1);
	}

	recordNotificationSent(): void {
		notificationSentTotal.add(1);
	}

	recordNotificationFailed(): void {
		notificationFailedTotal.add(1);
	}

	recordNotificationSuppression(): void {
		notificationSuppressionsTotal.add(1);
	}

	recordNotificationMarkedRead(): void {
		notificationMarkedReadTotal.add(1);
	}

	recordNotificationDeletion(): void {
		notificationDeletionsTotal.add(1);
	}
}
