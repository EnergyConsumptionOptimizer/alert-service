/**
 * Signals that a failure is permanent and must not be retried.
 * Consumers that catch this should route the message to the DLQ immediately.
 */
export class UnrecoverableError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message);
		this.name = this.constructor.name;
	}
}
