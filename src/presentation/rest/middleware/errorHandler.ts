import {
	NotificationNotFoundError,
	NotificationSuppressedError,
} from "@application/errors";
import {
	InvalidNotificationIdError,
	InvalidNotificationMessageError,
} from "@domain/errors";
import { notificationErrorsTotal } from "@infrastructure/metrics/errorMetrics";
import { AuthRequiredError, ForbiddenError } from "@presentation/errors";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import { ZodError } from "zod";

interface ErrorHandlerEntry {
	status: number;
	code: string;
}

const ERROR_MAP = new Map<new (...args: never[]) => Error, ErrorHandlerEntry>();

ERROR_MAP.set(AuthRequiredError, {
	status: StatusCodes.UNAUTHORIZED,
	code: "UNAUTHORIZED",
});
ERROR_MAP.set(ForbiddenError, {
	status: StatusCodes.FORBIDDEN,
	code: "FORBIDDEN",
});
ERROR_MAP.set(NotificationNotFoundError, {
	status: StatusCodes.NOT_FOUND,
	code: "RESOURCE_NOT_FOUND",
});
ERROR_MAP.set(NotificationSuppressedError, {
	status: StatusCodes.CONFLICT,
	code: "NOTIFICATION_SUPPRESSED",
});
ERROR_MAP.set(InvalidNotificationIdError, {
	status: StatusCodes.BAD_REQUEST,
	code: "BAD_REQUEST",
});
ERROR_MAP.set(InvalidNotificationMessageError, {
	status: StatusCodes.BAD_REQUEST,
	code: "BAD_REQUEST",
});

export function createErrorHandler(logger: Logger) {
	return (
		error: Error,
		req: Request,
		res: Response,
		next: NextFunction,
	): void => {
		if (res.headersSent) {
			next(error);
			return;
		}

		notificationErrorsTotal.add(1, { type: error.constructor.name });

		if (error instanceof ZodError) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of error.issues) {
				fieldErrors[issue.path.join(".")] = issue.message;
			}
			res.status(StatusCodes.BAD_REQUEST).json({
				code: "VALIDATION_ERROR",
				message: "Invalid request payload",
				errors: fieldErrors,
			});
			return;
		}

		const entry = ERROR_MAP.get(
			error.constructor as new (
				...args: never[]
			) => Error,
		);
		if (entry) {
			logger.warn(
				{ err: error, path: req.path, method: req.method },
				error.message,
			);
			res.status(entry.status).json({
				code: entry.code,
				message: error.message,
			});
			return;
		}

		logger.error(
			{ err: error, path: req.path, method: req.method },
			"Unhandled internal error",
		);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			code: "INTERNAL_SERVER_ERROR",
			message: "An unexpected error occurred",
		});
	};
}
