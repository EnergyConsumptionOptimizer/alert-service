import type { NotificationController } from "@presentation/rest/controllers/NotificationController";
import { forwardAuth } from "@presentation/rest/middleware/auth";
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

	// ── Forwarded‑auth (x‑user‑* headers from API gateway) ─
	router.use(
		"/api/notifications",
		forwardAuth,
		notificationRoutes(notificationController),
	);

	return router;
}
