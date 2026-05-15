import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import type { Logger } from "pino";

export function startInstrumentation(logger?: Logger): NodeSDK {
	const traceExporter = new OTLPTraceExporter({
		url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
	});
	const metricExporter = new OTLPMetricExporter({
		url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
	});

	const sdk = new NodeSDK({
		traceExporter,
		metricReader: new PeriodicExportingMetricReader({
			exporter: metricExporter,
		}),
		instrumentations: [getNodeAutoInstrumentations()],
	});

	try {
		sdk.start();
		logger?.info("OpenTelemetry SDK started");
	} catch (err) {
		logger?.error({ err }, "Failed to start OpenTelemetry SDK");
	}

	return sdk;
}
