import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export function validate(schema: ZodType) {
	return (req: Request, _res: Response, next: NextFunction): void => {
		const parsed = schema.parse({
			body: req.body,
			query: req.query,
			params: req.params,
		});

		const data = parsed as {
			body?: unknown;
			query?: unknown;
			params?: unknown;
		};
		if (data.body !== undefined) {
			req.body = data.body;
		}
		if (data.params !== undefined) {
			req.params = data.params as Record<string, string>;
		}

		next();
	};
}
