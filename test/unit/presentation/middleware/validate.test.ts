import { validate } from "@presentation/rest/middleware/validate";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";

const TestSchema = z.object({
	body: z.object({
		username: z.string().nonempty(),
	}),
});

function mockRequest(overrides?: Partial<Request>): Request {
	return {
		params: {},
		body: {},
		query: {},
		...overrides,
	} as Request;
}

function mockResponse(): Response {
	return {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as Response;
}

describe("validate() middleware", () => {
	let req: Request;
	let res: Response;
	let next: NextFunction;

	beforeEach(() => {
		req = mockRequest({ body: { username: "testuser" } });
		res = mockResponse();
		next = vi.fn();
	});

	it("should call next when validation passes", () => {
		const middleware = validate(TestSchema);

		middleware(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should override req.body with parsed value", () => {
		const middleware = validate(TestSchema);

		middleware(req, res, next);

		expect(req.body).toEqual({ username: "testuser" });
	});

	it("should throw ZodError when validation fails", () => {
		const middleware = validate(TestSchema);
		req.body = { username: "" };

		expect(() => middleware(req, res, next)).toThrow(ZodError);
		expect(next).not.toHaveBeenCalled();
	});

	it("should override req.params when schema defines params", () => {
		const ParamsSchema = z.object({
			params: z.object({ id: z.string() }),
		});
		const middleware = validate(ParamsSchema);
		req.params = { id: "123" };

		middleware(req, res, next);

		expect(next).toHaveBeenCalled();
	});
});
