export const WebApiErrorCode = {
	AUTH_REQUIRED: "AUTH_REQUIRED",
	FORBIDDEN: "FORBIDDEN",
} as const;

export abstract class WebApiError extends Error {
	public abstract readonly code: string;
	protected constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export class AuthRequiredError extends WebApiError {
	public readonly code = WebApiErrorCode.AUTH_REQUIRED;

	constructor() {
		super("Authentication required");
	}
}

export class ForbiddenError extends WebApiError {
	public readonly code = WebApiErrorCode.FORBIDDEN;

	constructor() {
		super("Forbidden: Insufficient permissions");
	}
}
