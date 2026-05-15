import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import { composeApp } from "@bootstrap/composeApp";
import { pino } from "pino";
import { vi } from "vitest";

vi.mock("@bootstrap/config", () => ({
	config: {
		port: 3000,
		mongo: { uri: "mongodb://placeholder" },
		kafka: {
			clientId: "test",
			brokers: ["localhost:9092"],
			groupId: "test-group",
			topics: {
				thresholdBreached: "test-breach",
				thresholdBreachedDlq: "test-breach-dlq",
			},
		},
		spamWindowMs: 3_600_000,
		logLevel: "silent" as const,
		appName: "test",
	},
}));

export { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";

export interface ComponentTestContext {
	app: Awaited<ReturnType<typeof composeApp>>["app"];
	notificationService: Awaited<
		ReturnType<typeof composeApp>
	>["notificationService"];
	sseRegistry: Awaited<ReturnType<typeof composeApp>>["sseRegistry"];
}

export async function composeAppForComponentTest(): Promise<ComponentTestContext> {
	const mockBusinessMetrics: BusinessMetricsPort = {
		recordNotificationCreation: vi.fn(),
		recordNotificationSent: vi.fn(),
		recordNotificationFailed: vi.fn(),
		recordNotificationSuppression: vi.fn(),
		recordNotificationMarkedRead: vi.fn(),
		recordNotificationDeletion: vi.fn(),
	};

	const { app, notificationService, sseRegistry } = await composeApp(
		pino({ level: "silent" }),
		mockBusinessMetrics,
	);

	return { app, notificationService, sseRegistry };
}
