import type { Config } from "@bootstrap/config";
import type { Logger, TransportTargetOptions } from "pino";
import pino from "pino";

export type LoggerConfig = Pick<Config, "logLevel" | "appName">;

export function createLogger(config: LoggerConfig): Logger {
	const targets: TransportTargetOptions[] = [
		{ target: "pino/file", options: { destination: 1 } },
	];

	if (
		process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ||
		process.env.OTEL_EXPORTER_OTLP_ENDPOINT
	) {
		targets.push({
			target: "pino-opentelemetry-transport",
			options: { loggerName: config.appName },
		});
	}

	return pino({
		name: config.appName,
		level: config.logLevel,
		base: undefined,
		redact: ["uri", "password"],
		transport: { targets },
	});
}
