import { UnrecoverableError } from "./UnrecoverableError";

const DELAYS_MS = [200, 500, 1_000] as const;

/**
 * Retry an async operation up to 3 attempts with fixed backoff delays
 * (200 ms → 500 ms → 1 000 ms). If the operation throws an
 * `UnrecoverableError` it is re-thrown immediately without retrying.
 */
export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
	let lastError: unknown;
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			return await operation();
		} catch (err) {
			if (err instanceof UnrecoverableError) {
				throw err;
			}
			lastError = err;
			if (attempt < DELAYS_MS.length) {
				await new Promise((resolve) => setTimeout(resolve, DELAYS_MS[attempt]));
			}
		}
	}
	throw lastError;
}
