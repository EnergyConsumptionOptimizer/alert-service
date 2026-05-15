import { UserRoles } from "@domain/value/UserRole";
import type { NotificationController } from "@presentation/rest/controllers/NotificationController";
import { forwardAuth, requireRole } from "@presentation/rest/middleware/auth";
import { validate } from "@presentation/rest/middleware/validate";
import { NotificationIdParamSchema } from "@presentation/rest/schemas/notification";
import { Router } from "express";

export function notificationRoutes(controller: NotificationController): Router {
	const router = Router();

	router.use(forwardAuth);

	router
		.route("/")
		.get((req, res) => controller.getAll(req, res))
		.delete(requireRole(UserRoles.ADMIN), (req, res) =>
			controller.deleteAll(req, res),
		);

	router.route("/stream").get((req, res) => controller.subscribe(req, res));

	router
		.route("/unread-count")
		.get((req, res) => controller.getUnreadCount(req, res));

	router
		.route("/:id")
		.get(validate(NotificationIdParamSchema), (req, res) =>
			controller.getById(req, res),
		)
		.delete(
			requireRole(UserRoles.ADMIN),
			validate(NotificationIdParamSchema),
			(req, res) => controller.deleteOne(req, res),
		);

	router.patch("/:id/read", validate(NotificationIdParamSchema), (req, res) =>
		controller.markAsRead(req, res),
	);

	return router;
}
