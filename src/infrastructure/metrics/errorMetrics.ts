import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("notification-service");

export const notificationErrorsTotal = meter.createCounter(
	"notification_errors_total",
	{ description: "Total number of errors in notification service" },
);
