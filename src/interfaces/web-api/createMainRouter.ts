import { Router } from "express";
import { AlertController } from "./AlertController";
import { InternalAlertController } from "./internal/InternalAlertController";
import { AuthMiddleware } from "./middleware/AuthMiddleware";

const createInternalRouter = (controller: InternalAlertController): Router => {
  const router = Router();
  router.post("/", controller.create);
  router.get("/stream", controller.subscribe);
  return router;
};

const createPublicRouter = (
  controller: AlertController,
  auth: AuthMiddleware,
): Router => {
  const router = Router();

  router
    .route("/")
    .get(auth.authenticate, controller.getAll)
    .delete(auth.authenticateAdmin, controller.deleteAll);

  router
    .route("/:id")
    .get(auth.authenticate, controller.getById)
    .delete(auth.authenticateAdmin, controller.deleteOne);

  router.get("/unread-count", auth.authenticate, controller.getUnreadCount);
  router.patch("/:id/read", auth.authenticate, controller.markAsRead);

  return router;
};

export function createMainRouter(
  publicController: AlertController,
  internalController: InternalAlertController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use("/api", createPublicRouter(publicController, authMiddleware));
  router.use("/internal", createInternalRouter(internalController));

  return router;
}
