import type { NotificationService } from "@application/ports/in/NotificationService";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import { NotificationServiceImpl } from "@application/services/NotificationServiceImpl";
import { createApp } from "@bootstrap/app.js";
import { config } from "@bootstrap/config";
import { createMainRouter } from "@bootstrap/createMainRouter.js";
import { KafkaDlqPublisher } from "@infrastructure/messaging/KafkaDlqPublisher";
import { OtelBusinessMetrics } from "@infrastructure/metrics/OtelBusinessMetrics";
import { MongoInboxRepository } from "@infrastructure/persistence/mongo/MongoInboxRepository";
import { MongoNotificationRepository } from "@infrastructure/persistence/mongo/MongoNotificationRepository";
import { SseNotificationSender } from "@infrastructure/sse/SseNotificationSender";
import { SseRegistry } from "@infrastructure/sse/SseRegistry";
import { NodeCryptoIdGenerator } from "@infrastructure/utils/NodeCryptoIdGenerator";
import { KafkaThresholdBreachedConsumer } from "@presentation/messaging/KafkaThresholdBreachedConsumer";
import { ThresholdBreachedHandler } from "@presentation/messaging/ThresholdBreachedHandler";
import { NotificationController } from "@presentation/rest/controllers/NotificationController";
import type { Express } from "express";
import type { Logger } from "pino";

export interface ComposedApp {
	readonly app: Express;
	readonly notificationService: NotificationService;
	readonly sseRegistry: SseRegistry;
	readonly thresholdBreachedConsumer: KafkaThresholdBreachedConsumer;
	readonly thresholdBreachedDlqPublisher: KafkaDlqPublisher;
}

export async function composeApp(
	logger: Logger,
	businessMetrics?: BusinessMetricsPort,
): Promise<ComposedApp> {
	const sseRegistry = new SseRegistry(
		logger.child({ component: "SseRegistry" }),
	);

	const notificationRepository = new MongoNotificationRepository(
		logger.child({ component: "MongoNotificationRepository" }),
	);
	const idGenerator = new NodeCryptoIdGenerator();
	const notificationSender = new SseNotificationSender(sseRegistry);
	const metrics = businessMetrics ?? new OtelBusinessMetrics();
	const inboxRepository = new MongoInboxRepository(
		logger.child({ component: "MongoInboxRepository" }),
	);

	const notificationService = new NotificationServiceImpl(
		notificationRepository,
		idGenerator,
		notificationSender,
		metrics,
		config.spamWindowMs,
	);

	const notificationController = new NotificationController(
		notificationService,
		sseRegistry,
	);

	const mainRouter = createMainRouter(notificationController);
	const app = createApp(mainRouter, logger);

	const thresholdBreachedDlqPublisher = new KafkaDlqPublisher(
		config.kafka.brokers,
		config.kafka.clientId,
		config.kafka.topics.thresholdBreachedDlq,
		logger.child({ component: "KafkaDlqPublisher" }),
	);

	const thresholdBreachedHandler = new ThresholdBreachedHandler(
		notificationService,
		inboxRepository,
		thresholdBreachedDlqPublisher,
		logger.child({ component: "ThresholdBreachedHandler" }),
	);

	const thresholdBreachedConsumer = new KafkaThresholdBreachedConsumer(
		config.kafka.brokers,
		config.kafka.clientId,
		config.kafka.groupId,
		config.kafka.topics.thresholdBreached,
		thresholdBreachedHandler,
		logger.child({ component: "KafkaThresholdBreachedConsumer" }),
	);

	return {
		app,
		notificationService,
		sseRegistry,
		thresholdBreachedConsumer,
		thresholdBreachedDlqPublisher,
	};
}
