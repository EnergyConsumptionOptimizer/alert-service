import type { Server } from "node:http";
import type { ComposedApp } from "@bootstrap/composeApp";
import type { NodeSDK } from "@opentelemetry/sdk-node";
import mongoose from "mongoose";
import type { Logger } from "pino";

export function setupGracefulShutdown(
	server: Server,
	deps: ComposedApp,
	sdk: NodeSDK,
	logger: Logger,
): void {
	const shutdown = async () => {
		logger.info("graceful shutdown initiated");
		deps.sseRegistry.stop();
		server.close();
		try {
			await deps.thresholdBreachedConsumer.disconnect();
		} catch {
			/* ignore */
		}
		try {
			await deps.thresholdBreachedDlqPublisher.disconnect();
		} catch {
			/* ignore */
		}
		await mongoose.disconnect();
		try {
			await sdk.shutdown();
			logger.info("OpenTelemetry SDK shut down");
		} catch (err) {
			logger.error({ err }, "error shutting down OpenTelemetry SDK");
		}
		process.exit(0);
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
}
