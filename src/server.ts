import "dotenv/config";

import { composeApp } from "@bootstrap/composeApp";
import { config } from "@bootstrap/config";
import { connectMongo } from "@bootstrap/mongoConnection";
import { retryForever } from "@bootstrap/retryForever";
import { setupGracefulShutdown } from "@bootstrap/shutdown";
import { startInstrumentation } from "@root/instrumentation.js";
import { createLogger } from "@root/logger.js";

const rootLogger = createLogger(config);
const logger = rootLogger.child({ component: "Server" });
const sdk = startInstrumentation(rootLogger);

async function start(): Promise<void> {
	await connectMongo(logger);

	const composed = await composeApp(rootLogger);

	const server = composed.app.listen(config.port, () => {
		logger.info({ port: config.port }, "listening");
	});

	composed.sseRegistry.start();

	void retryForever(
		"Kafka threshold-breach DLQ producer",
		async () => composed.thresholdBreachedDlqPublisher.connect(),
		logger,
	);

	void retryForever(
		"Kafka threshold-breach consumer",
		async () => {
			await composed.thresholdBreachedConsumer.connect();
			await composed.thresholdBreachedConsumer.start();
		},
		logger,
	);

	setupGracefulShutdown(server, composed, sdk, logger);
}

void start();
