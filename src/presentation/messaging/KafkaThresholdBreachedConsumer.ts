import type { ThresholdBreachedHandler } from "@presentation/messaging/ThresholdBreachedHandler";
import { type Consumer, type EachMessagePayload, Kafka } from "kafkajs";
import type { Logger } from "pino";

export class KafkaThresholdBreachedConsumer {
	readonly #logger?: Logger;
	readonly #consumer: Consumer;
	readonly #topic: string;
	readonly #handler: ThresholdBreachedHandler;

	constructor(
		brokers: string[],
		clientId: string,
		groupId: string,
		topic: string,
		handler: ThresholdBreachedHandler,
		logger?: Logger,
	) {
		this.#logger = logger;
		this.#topic = topic;
		this.#handler = handler;
		const kafka = new Kafka({
			clientId,
			brokers,
			retry: { retries: 0 },
		});
		this.#consumer = kafka.consumer({ groupId });
	}

	async connect(): Promise<void> {
		await this.#consumer.connect();
		await this.#consumer.subscribe({
			topic: this.#topic,
			fromBeginning: false,
		});
		this.#logger?.info({ topic: this.#topic }, "Subscribed");
	}

	async start(): Promise<void> {
		await this.#consumer.run({
			eachMessage: async (payload: EachMessagePayload) => {
				const raw = payload.message.value?.toString();
				if (!raw) {
					this.#logger?.debug(
						{ partition: payload.partition, offset: payload.message.offset },
						"Empty Kafka message, skipping",
					);
					return;
				}
				await this.#handler.handle(raw);
			},
		});
	}

	async disconnect(): Promise<void> {
		await this.#consumer.disconnect();
	}
}
