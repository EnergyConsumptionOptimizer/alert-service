import type { DlqPublisher } from "@infrastructure/messaging/DlqPublisher";
import { notificationDlqPublishesTotal } from "@infrastructure/metrics/businessMetrics";
import { Kafka, type Producer } from "kafkajs";
import type { Logger } from "pino";

export class KafkaDlqPublisher implements DlqPublisher {
	readonly #logger?: Logger;
	readonly #producer: Producer;
	readonly #topic: string;

	constructor(
		brokers: string[],
		clientId: string,
		topic: string,
		logger?: Logger,
	) {
		this.#logger = logger?.child({ component: "KafkaDlqPublisher" });
		this.#topic = topic;
		const kafka = new Kafka({
			clientId,
			brokers,
			retry: { retries: 0 },
		});
		this.#producer = kafka.producer();
	}

	async connect(): Promise<void> {
		await this.#producer.connect();
	}

	async disconnect(): Promise<void> {
		await this.#producer.disconnect();
	}

	async publish(raw: string, reason: unknown): Promise<void> {
		const errorMessage =
			reason instanceof Error ? reason.message : String(reason);

		this.#logger?.warn(
			{ topic: this.#topic, errorMessage },
			"Publishing to DLQ",
		);

		await this.#producer.send({
			topic: this.#topic,
			messages: [
				{
					value: raw,
					headers: { "x-dlq-reason": errorMessage },
				},
			],
		});

		notificationDlqPublishesTotal.add(1);
		this.#logger?.debug({ topic: this.#topic }, "Published to DLQ");
	}
}
