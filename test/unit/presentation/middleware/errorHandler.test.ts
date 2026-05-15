import {
	NotificationNotFoundError,
	NotificationSuppressedError,
} from "@application/errors";
import {
	InvalidNotificationIdError,
	InvalidNotificationMessageError,
} from "@domain/errors";
import { AuthRequiredError, ForbiddenError } from "@presentation/errors";
import { createErrorHandler } from "@presentation/rest/middleware/errorHandler";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

function mockRequest(overrides?: Partial<Request>): Request {
	return {
		params: {},
		body: {},
		headers: {},
		path: "/api/test",
		method: "GET",
		...overrides,
	} as Request;
}

function mockResponse(): Response {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		headersSent: false,
	};
	return res as unknown as Response;
}

function mockLogger(): Logger {
	return {
		warn: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		fatal: vi.fn(),
	} as unknown as Logger;
}

describe("errorHandler() middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const logger = mockLogger();
	const errorHandler = createErrorHandler(logger);
	const next: NextFunction = vi.fn();

	it("should call next if headers have already been sent", () => {
		const req = mockRequest();
		const res = mockResponse();
		res.headersSent = true;

		errorHandler(new Error("test"), req, res, next);

		expect(next).toHaveBeenCalled();
		expect(res.status).not.toHaveBeenCalled();
	});

	describe("known error types", () => {
		it.each([
			{
				error: new AuthRequiredError(),
				expectedStatus: StatusCodes.UNAUTHORIZED,
				expectedCode: "UNAUTHORIZED",
			},
			{
				error: new ForbiddenError(),
				expectedStatus: StatusCodes.FORBIDDEN,
				expectedCode: "FORBIDDEN",
			},
			{
				error: new NotificationNotFoundError("notif-1"),
				expectedStatus: StatusCodes.NOT_FOUND,
				expectedCode: "RESOURCE_NOT_FOUND",
			},
			{
				error: new NotificationSuppressedError(),
				expectedStatus: StatusCodes.CONFLICT,
				expectedCode: "NOTIFICATION_SUPPRESSED",
			},
			{
				error: new InvalidNotificationIdError("NOTIFICATION_ID_EMPTY", "empty"),
				expectedStatus: StatusCodes.BAD_REQUEST,
				expectedCode: "BAD_REQUEST",
			},
			{
				error: new InvalidNotificationMessageError(
					"NOTIFICATION_MESSAGE_EMPTY",
					"empty",
				),
				expectedStatus: StatusCodes.BAD_REQUEST,
				expectedCode: "BAD_REQUEST",
			},
		])("should map $error.constructor.name to status $expectedStatus", ({
			error,
			expectedStatus,
			expectedCode,
		}) => {
			const req = mockRequest();
			const res = mockResponse();

			errorHandler(error, req, res, next);

			expect(res.status).toHaveBeenCalledWith(expectedStatus);
			expect(res.json).toHaveBeenCalledWith({
				code: expectedCode,
				message: error.message,
			});
			expect(logger.warn).toHaveBeenCalled();
		});
	});

	it("should handle ZodError with validation details", () => {
		const zodError = new ZodError([
			{
				code: "custom",
				message: "SourceId is required",
				path: ["body", "sourceId"],
			},
			{
				code: "custom",
				message: "Message is required",
				path: ["body", "message"],
			},
		]);
		const req = mockRequest();
		const res = mockResponse();

		errorHandler(zodError, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
		expect(res.json).toHaveBeenCalledWith({
			code: "VALIDATION_ERROR",
			message: "Invalid request payload",
			errors: {
				"body.sourceId": "SourceId is required",
				"body.message": "Message is required",
			},
		});
	});

	it("should return 500 for unhandled errors", () => {
		const error = new Error("Unexpected failure");
		const req = mockRequest();
		const res = mockResponse();

		errorHandler(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(res.json).toHaveBeenCalledWith({
			code: "INTERNAL_SERVER_ERROR",
			message: "An unexpected error occurred",
		});
		expect(logger.error).toHaveBeenCalled();
	});
});
