import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("notification-service");

export const notificationCreationsTotal = meter.createCounter(
	"notification_creations_total",
	{ description: "Total number of notification creations" },
);

export const notificationSentTotal = meter.createCounter(
	"notification_sent_total",
	{ description: "Total number of notifications successfully sent via SSE" },
);

export const notificationFailedTotal = meter.createCounter(
	"notification_failed_total",
	{ description: "Total number of notification delivery failures" },
);

export const notificationSuppressionsTotal = meter.createCounter(
	"notification_suppressions_total",
	{ description: "Total number of notifications suppressed by spam policy" },
);

export const notificationMarkedReadTotal = meter.createCounter(
	"notification_marked_read_total",
	{ description: "Total number of notifications marked as read" },
);

export const notificationDeletionsTotal = meter.createCounter(
	"notification_deletions_total",
	{ description: "Total number of notification deletions" },
);

export const notificationDlqPublishesTotal = meter.createCounter(
	"notification_dlq_publishes_total",
	{ description: "Total number of messages published to the notification DLQ" },
);
