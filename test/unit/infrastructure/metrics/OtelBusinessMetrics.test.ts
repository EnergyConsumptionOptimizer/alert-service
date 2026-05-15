import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import { OtelBusinessMetrics } from "@infrastructure/metrics/OtelBusinessMetrics";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/metrics/businessMetrics", () => ({
	notificationCreationsTotal: { add: vi.fn() },
	notificationSentTotal: { add: vi.fn() },
	notificationFailedTotal: { add: vi.fn() },
	notificationSuppressionsTotal: { add: vi.fn() },
	notificationMarkedReadTotal: { add: vi.fn() },
	notificationDeletionsTotal: { add: vi.fn() },
}));

import {
	notificationCreationsTotal,
	notificationDeletionsTotal,
	notificationFailedTotal,
	notificationMarkedReadTotal,
	notificationSentTotal,
	notificationSuppressionsTotal,
} from "@infrastructure/metrics/businessMetrics";

describe("OtelBusinessMetrics", () => {
	let metrics: BusinessMetricsPort;

	beforeEach(() => {
		vi.clearAllMocks();
		metrics = new OtelBusinessMetrics();
	});

	it("should record notification creation", () => {
		metrics.recordNotificationCreation();
		expect(notificationCreationsTotal.add).toHaveBeenCalledWith(1);
	});

	it("should record notification sent", () => {
		metrics.recordNotificationSent();
		expect(notificationSentTotal.add).toHaveBeenCalledWith(1);
	});

	it("should record notification failed", () => {
		metrics.recordNotificationFailed();
		expect(notificationFailedTotal.add).toHaveBeenCalledWith(1);
	});

	it("should record notification suppression", () => {
		metrics.recordNotificationSuppression();
		expect(notificationSuppressionsTotal.add).toHaveBeenCalledWith(1);
	});

	it("should record notification marked as read", () => {
		metrics.recordNotificationMarkedRead();
		expect(notificationMarkedReadTotal.add).toHaveBeenCalledWith(1);
	});

	it("should record notification deletion", () => {
		metrics.recordNotificationDeletion();
		expect(notificationDeletionsTotal.add).toHaveBeenCalledWith(1);
	});
});
