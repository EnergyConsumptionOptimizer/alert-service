import type { NotificationService } from "@application/ports/in/NotificationService";
import type { DlqPublisher } from "@infrastructure/messaging/DlqPublisher";
import type { InboxRepository } from "@infrastructure/persistence/InboxRepository";
import { UnrecoverableError } from "@infrastructure/utils/UnrecoverableError";
import { withRetry } from "@infrastructure/utils/withRetry";
import { trace } from "@opentelemetry/api";
import type { Logger } from "pino";
import { z } from "zod";

const ThresholdBreachedMessageSchema = z.object({
	eventId: z.string(),
	eventType: z.string().optional(),
	correlationId: z.string().optional(),
	payload: z.object({
		thresholdId: z.string(),
		thresholdName: z.string(),
		utilityType: z.string(),
		thresholdType: z.string(),
		limitValue: z.number(),
		detectedValue: z.number(),
		periodType: z.string().optional(),
	}),
});

function buildMessage(
	payload: z.infer<typeof ThresholdBreachedMessageSchema>["payload"],
): string {
	const period = payload.periodType != null ? ` for ${payload.periodType}` : "";
	return `Threshold "${payload.thresholdName}" breached${period}: detected ${payload.detectedValue} exceeds limit ${payload.limitValue}`;
}

export class ThresholdBreachedHandler {
	readonly #logger?: Logger;
	readonly #notificationService: NotificationService;
	readonly #inbox: InboxRepository;
	readonly #dlq: DlqPublisher;

	constructor(
		notificationService: NotificationService,
		inbox: InboxRepository,
		dlq: DlqPublisher,
		logger?: Logger,
	) {
		this.#notificationService = notificationService;
		this.#inbox = inbox;
		this.#dlq = dlq;
		this.#logger = logger;
	}

	async handle(raw: string): Promise<void> {
		let message: z.infer<typeof ThresholdBreachedMessageSchema>;
		try {
			const json: unknown = JSON.parse(raw);
			message = ThresholdBreachedMessageSchema.parse(json);
		} catch (err) {
			this.#logger?.warn(
				{ err },
				"Unrecoverable parse failure, routing to DLQ",
			);
			await this.#dlq.publish(
				raw,
				new UnrecoverableError("Parse failure", err),
			);
			return;
		}

		if (
			message.eventType !== undefined &&
			message.eventType !== "ThresholdBreachedEvent"
		) {
			this.#logger?.warn(
				{ eventType: message.eventType },
				"Unexpected eventType, routing to DLQ",
			);
			await this.#dlq.publish(
				raw,
				new UnrecoverableError(`Unexpected eventType: ${message.eventType}`),
			);
			return;
		}

		const acquired = await this.#inbox.tryAcquire(message.eventId);
		if (!acquired) {
			this.#logger?.debug(
				{ eventId: message.eventId },
				"Duplicate eventId, skipping",
			);
			return;
		}

		const correlationId = message.correlationId ?? message.eventId;
		const childLogger = this.#logger?.child({ correlationId });

		const tracer = trace.getTracer("notification-service");
		await tracer.startActiveSpan(
			"ThresholdBreachedHandler.handle",
			{
				attributes: {
					eventId: message.eventId,
					correlationId,
					thresholdId: message.payload.thresholdId,
					utilityType: message.payload.utilityType,
				},
			},
			async (span) => {
				try {
					const notificationMessage = buildMessage(message.payload);

					await withRetry(() =>
						this.#notificationService.create({
							sourceId: message.payload.thresholdId,
							message: notificationMessage,
						}),
					);
				} catch (err) {
					childLogger?.warn(
						{ err, eventId: message.eventId },
						"Retry exhausted, publishing to DLQ",
					);
					await this.#dlq.publish(raw, err);
				} finally {
					span.end();
				}
			},
		);
	}
}
