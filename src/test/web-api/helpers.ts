import { mock } from "vitest-mock-extended";
import express from "express";
import cookieParser from "cookie-parser";
import { AlertService } from "@application/AlertService";
import { AuthMiddleware } from "@interfaces/web-api/middleware/AuthMiddleware";
import { SseSender } from "@interfaces/web-api/SseSender";
import { AlertController } from "@interfaces/web-api/AlertController";
import { InternalAlertController } from "@interfaces/web-api/internal/InternalAlertController";
import { createMainRouter } from "@interfaces/web-api/createMainRouter";
import { errorMiddleware } from "@interfaces/web-api/middleware/errorMiddleware";

export const mockAlertService = mock<AlertService>();
export const mockAuthMiddleware = mock<AuthMiddleware>();
export const mockSseSender = mock<SseSender>();

mockAuthMiddleware.authenticate.mockImplementation((req, res, next) => {
  next();
  return Promise.resolve();
});

mockAuthMiddleware.authenticateAdmin.mockImplementation((req, res, next) => {
  next();
  return Promise.resolve();
});

mockSseSender.addClient.mockImplementation((res) => {
  res.end();
});

export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const alertController = new AlertController(mockAlertService);
  const internalController = new InternalAlertController(
    mockAlertService,
    mockSseSender,
  );

  const router = createMainRouter(
    alertController,
    internalController,
    mockAuthMiddleware,
  );

  app.use(router);
  app.use(errorMiddleware);

  return app;
}
