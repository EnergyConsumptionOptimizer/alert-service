import type { NotificationService } from "@application/ports/in/NotificationService";
import type { DlqPublisher } from "@infrastructure/messaging/DlqPublisher";
import type { InboxRepository } from "@infrastructure/persistence/InboxRepository";
import { ThresholdBreachedHandler } from "@presentation/messaging/ThresholdBreachedHandler";
import { beforeEach, describe, expect, it } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

function validThresholdBreachedEvent(overrides?: {
	eventId?: string;
	thresholdId?: string;
	thresholdName?: string;
	utilityType?: string;
	thresholdType?: string;
	limitValue?: number;
	detectedValue?: number;
	periodType?: string;
}): string {
	const payload: Record<string, unknown> = {
		thresholdId: overrides?.thresholdId ?? "th-1",
		thresholdName: overrides?.thresholdName ?? "High Electricity",
		utilityType: overrides?.utilityType ?? "ELECTRICITY",
		thresholdType: overrides?.thresholdType ?? "HISTORICAL",
		limitValue: overrides?.limitValue ?? 100,
		detectedValue: overrides?.detectedValue ?? 150,
	};

	if (!overrides || !("periodType" in overrides)) {
		payload.periodType = "ONE_DAY";
	} else if (overrides.periodType !== undefined) {
		payload.periodType = overrides.periodType;
	}

	return JSON.stringify({
		eventId: overrides?.eventId ?? "evt-1",
		eventType: "ThresholdBreachedEvent",
		correlationId: "corr-1",
		payload,
	});
}

describe("ThresholdBreachedHandler", () => {
	let notificationService: MockProxy<NotificationService>;
	let inbox: MockProxy<InboxRepository>;
	let dlq: MockProxy<DlqPublisher>;
	let handler: ThresholdBreachedHandler;

	beforeEach(() => {
		notificationService = mock<NotificationService>();
		inbox = mock<InboxRepository>();
		dlq = mock<DlqPublisher>();

		inbox.tryAcquire.mockResolvedValue(true);
		notificationService.create.mockResolvedValue({
			id: "notif-1",
			sourceId: "th-1",
			message: "any",
			state: "PENDING",
			createdAt: new Date().toISOString(),
			sentAt: null,
			failedReason: null,
			readAt: null,
			isRead: false,
		});

		handler = new ThresholdBreachedHandler(notificationService, inbox, dlq);
	});

	describe("handle()", () => {
		it("should parse event, acquire inbox, and create notification", async () => {
			const raw = validThresholdBreachedEvent();

			await handler.handle(raw);

			expect(inbox.tryAcquire).toHaveBeenCalledWith("evt-1");
			expect(notificationService.create).toHaveBeenCalledWith({
				sourceId: "th-1",
				message:
					'Threshold "High Electricity" breached for ONE_DAY: detected 150 exceeds limit 100',
			});
			expect(dlq.publish).not.toHaveBeenCalled();
		});

		it("should build message without period when periodType is absent", async () => {
			const raw = validThresholdBreachedEvent({ periodType: undefined });

			await handler.handle(raw);

			expect(notificationService.create).toHaveBeenCalledWith({
				sourceId: "th-1",
				message:
					'Threshold "High Electricity" breached: detected 150 exceeds limit 100',
			});
		});

		it("should skip duplicate event via inbox", async () => {
			inbox.tryAcquire.mockResolvedValue(false);
			const raw = validThresholdBreachedEvent();

			await handler.handle(raw);

			expect(notificationService.create).not.toHaveBeenCalled();
			expect(dlq.publish).not.toHaveBeenCalled();
		});

		it("should route to DLQ on parse failure", async () => {
			const raw = "not-valid-json";

			await handler.handle(raw);

			expect(dlq.publish).toHaveBeenCalledWith(
				raw,
				expect.objectContaining({ message: "Parse failure" }),
			);
			expect(notificationService.create).not.toHaveBeenCalled();
		});

		it("should route to DLQ on wrong eventType", async () => {
			const raw = JSON.stringify({
				eventId: "evt-1",
				eventType: "WrongEvent",
				payload: {
					thresholdId: "th-1",
					thresholdName: "Test",
					utilityType: "ELECTRICITY",
					thresholdType: "HISTORICAL",
					limitValue: 100,
					detectedValue: 150,
				},
			});

			await handler.handle(raw);

			expect(dlq.publish).toHaveBeenCalledWith(
				raw,
				expect.objectContaining({
					message: "Unexpected eventType: WrongEvent",
				}),
			);
			expect(notificationService.create).not.toHaveBeenCalled();
		});

		it("should route to DLQ when service.create throws after retries", async () => {
			notificationService.create.mockRejectedValue(new Error("Service error"));
			const raw = validThresholdBreachedEvent();

			await handler.handle(raw);

			expect(dlq.publish).toHaveBeenCalledWith(raw, expect.any(Error));
		});

		it("should accept missing eventType (optional field)", async () => {
			const raw = JSON.stringify({
				eventId: "evt-1",
				payload: {
					thresholdId: "th-1",
					thresholdName: "Test",
					utilityType: "ELECTRICITY",
					thresholdType: "HISTORICAL",
					limitValue: 100,
					detectedValue: 150,
				},
			});

			await handler.handle(raw);

			expect(notificationService.create).toHaveBeenCalled();
			expect(dlq.publish).not.toHaveBeenCalled();
		});
	});
});
