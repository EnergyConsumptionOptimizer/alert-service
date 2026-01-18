import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import { InvalidAlertIdError } from "@domain/errors";
import { InvalidTokenError } from "./AuthMiddleware";
import { AlertNotFoundError } from "@application/errors";

interface ErrorConfig {
  status: number;
  code: string;
  field?: string;
}

const ERROR_MAP = new Map<string, ErrorConfig>([
  [InvalidAlertIdError.name, { status: 400, code: "BAD_REQUEST" }],
  [AlertNotFoundError.name, { status: 404, code: "RESOURCE_NOT_FOUND" }],
  [InvalidTokenError.name, { status: 401, code: "UNAUTHORIZED" }],
]);

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};

    error.issues.forEach((issue) => {
      fieldErrors[issue.path.join(".")] = issue.message;
    });

    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Invalid request payload",
      errors: fieldErrors,
    });
  }

  const config = ERROR_MAP.get(error.name);

  if (config) {
    const errorsPayload = config.field ? { [config.field]: error.message } : {};

    return res.status(config.status).json({
      code: config.code,
      message: config.field ? "Validation failed" : error.message,
      errors: errorsPayload,
    });
  }

  console.error("Unhandled error:", error);

  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Internal Server Error",
    errors: {},
  });
};
