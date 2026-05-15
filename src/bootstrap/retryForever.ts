import type { Logger } from "pino";

export async function retryForever(
	label: string,
	fn: () => Promise<void>,
	logger: Logger,
): Promise<void> {
	let attempt = 0;
	while (true) {
		try {
			attempt++;
			await fn();
			logger.info({ attempt }, `${label} connected`);
			return;
		} catch (err) {
			const delay = Math.min(1000 * 2 ** (attempt - 1), 30000);
			logger.warn(
				{ err, attempt, nextRetryMs: delay },
				`${label} unavailable, retrying in ${delay}ms`,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}
