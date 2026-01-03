import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { InvalidAlertIdError } from "@domain/errors";
import { InvalidTokenError } from "./AuthMiddleware";
import { AlertNotFoundError } from "@application/errors";

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      details: err.message,
    });
  }

  if (err instanceof InvalidAlertIdError) {
    return res.status(400).json({ success: false, error: err.message });
  }

  if (err instanceof AlertNotFoundError) {
    return res.status(404).json({ success: false, error: err.message });
  }

  if (err instanceof InvalidTokenError) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  res.status(500).json({
    success: false,
    error: message,
  });
};
