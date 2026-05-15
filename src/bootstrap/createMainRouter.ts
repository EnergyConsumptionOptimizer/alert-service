import type { NotificationController } from "@presentation/rest/controllers/NotificationController";
import { notificationRoutes } from "@presentation/rest/routes/notificationRoutes";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

export function createMainRouter(
	notificationController: NotificationController,
): Router {
	const router = Router();

	router.get("/health", (_req, res) => {
		res.status(StatusCodes.OK).json({
			status: "ok",
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
		});
	});

	router.use("/api/notifications", notificationRoutes(notificationController));

	return router;
}
