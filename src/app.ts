import express, { Application } from "express";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@interfaces/web-api/middleware/errorMiddleware";
import { Router } from "express";

export const createApp = (appRouter: Router): Application => {
  const app = express();

  app.use(cookieParser());
  app.use(express.json());
  app.use(appRouter);
  app.use(errorMiddleware);

  return app;
};
