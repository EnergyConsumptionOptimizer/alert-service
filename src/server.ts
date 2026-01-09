import mongoose from "mongoose";
import { config } from "./config";
import { Application } from "express";
import { MongoAlertRepository } from "@storage/MongoAlertRepository";
import { SseSender } from "@interfaces/web-api/SseSender";
import { AlertService } from "@application/AlertService";
import { AuthMiddleware } from "@interfaces/web-api/middleware/AuthMiddleware";
import { AlertController } from "@interfaces/web-api/AlertController";
import { InternalAlertController } from "@interfaces/web-api/internal/InternalAlertController";
import { createMainRouter } from "@interfaces/web-api/createMainRouter";
import { createApp } from "./app";

/**
 * Constructs application wiring (repositories, services, controllers) and returns an Express app.
 *
 * @returns The composed Express application.
 */
export const composeApp = (): Application => {
  const repository = new MongoAlertRepository();
  const sender = new SseSender();

  const service = new AlertService(repository, sender);

  const authMiddleware = new AuthMiddleware(config.services.user.uri);
  const publicController = new AlertController(service, sender);
  const internalController = new InternalAlertController(service);

  const router = createMainRouter(
    publicController,
    internalController,
    authMiddleware,
  );

  return createApp(router);
};

const start = async () => {
  try {
    await mongoose.connect(config.db.uri);
    console.log("Connected to MongoDB");

    const app = composeApp();

    app.listen(config.server.port, () => {
      console.log(`Server running on port ${config.server.port}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
};

start();
