import { Router } from "express";
import { AlertController } from "./AlertController";
import { InternalAlertController } from "./internal/InternalAlertController";
import { AuthMiddleware } from "./middleware/AuthMiddleware";

const createInternalRouter = (controller: InternalAlertController): Router => {
  const router = Router();
  router.post("/", controller.create);
  return router;
};

const createPublicRouter = (
  controller: AlertController,
  auth: AuthMiddleware,
): Router => {
  const router = Router();

  router.get("/stream", auth.authenticate, controller.subscribe);
  router.get("/unread-count", auth.authenticate, controller.getUnreadCount);

  router
    .route("/")
    .get(auth.authenticate, controller.getAll)
    .delete(auth.authenticateAdmin, controller.deleteAll);

  router
    .route("/:id")
    .get(auth.authenticate, controller.getById)
    .patch(auth.authenticate, controller.updateReadState)
    .delete(auth.authenticateAdmin, controller.deleteOne);

  return router;
};

export function createMainRouter(
  publicController: AlertController,
  internalController: InternalAlertController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use("/api/internal/alerts", createInternalRouter(internalController));
  router.use(
    "/api/alerts",
    createPublicRouter(publicController, authMiddleware),
  );
  router.get("/health", (_req, res) => res.send("OK"));

  return router;
}
