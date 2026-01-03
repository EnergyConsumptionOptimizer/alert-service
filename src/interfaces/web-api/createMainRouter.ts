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
  router.get("/:id", auth.authenticate, controller.getById);
  router.get("/", auth.authenticate, controller.getAll);
  router.delete("/:id", auth.authenticateAdmin, controller.deleteOne);
  router.delete("/", auth.authenticateAdmin, controller.deleteAll);
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
