import { MongoAlertRepository } from "@storage/MongoAlertRepository";
import { AlertService } from "@application/AlertService";
import { SseSender } from "@interfaces/web-api/SseSender";
import { AlertController } from "@interfaces/web-api/AlertController";
import { InternalAlertController } from "@interfaces/web-api/internal/InternalAlertController";
import { AuthMiddleware } from "@interfaces/web-api/middleware/AuthMiddleware";
import { createMainRouter } from "@interfaces/web-api/createMainRouter";
import { Router } from "express";

export interface AppDependencies {
  alertController: AlertController;
  internalAlertController: InternalAlertController;
  authMiddleware: AuthMiddleware;
  appRouter: Router;
}

export const initDependencies = (): AppDependencies => {
  const repository = new MongoAlertRepository();
  const sseManager = new SseSender();

  const service = new AlertService(repository, sseManager);
  const authMiddleware = new AuthMiddleware();
  const alertController = new AlertController(service);
  const internalAlertController = new InternalAlertController(
    service,
    sseManager,
  );

  const appRouter = createMainRouter(
    alertController,
    internalAlertController,
    authMiddleware,
  );

  return {
    alertController,
    internalAlertController,
    authMiddleware,
    appRouter,
  };
};
