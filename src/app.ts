import express, { Application } from "express";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@interfaces/web-api/middleware/errorMiddleware";
import { Router } from "express";

/**
 * Creates and configures the Express application.
 *
 * @param appRouter - The router containing application routes.
 * @returns The configured Express application.
 */
export const createApp = (appRouter: Router): Application => {
  const app = express();

  app.use(cookieParser());
  app.use(express.json());
  app.use(appRouter);
  app.use(errorMiddleware);

  return app;
};
