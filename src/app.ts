import express, { Application } from "express";
import { errorMiddleware } from "@interfaces/web-api/middleware/errorMiddleware";
import { AppDependencies } from "./dependencies";
import cookieParser from "cookie-parser";

export const createApp = (dependencies: AppDependencies): Application => {
  const app = express();

  app.use(cookieParser());
  app.use(express.json());
  app.use(dependencies.appRouter);
  app.use(errorMiddleware);

  return app;
};
