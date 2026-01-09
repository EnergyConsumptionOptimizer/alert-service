import { Request, Response, NextFunction } from "express";
import { AlertService } from "@application/AlertService";
import * as AlertPresenter from "./presenter/AlertPresenter";
import { SseSender } from "@interfaces/web-api/SseSender";
import { UpdateReadStateAlertSchema } from "@presentation/CreateAlertSchema";

/**
 * Exposes public HTTP endpoints for alert operations.
 */
export class AlertController {
  /**
   * @param service - The alert application service used to fulfill requests.
   * @param sse - The SSE sender used for streaming alerts to clients.
   */
  constructor(
    private readonly service: AlertService,
    private readonly sse: SseSender,
  ) {}

  /**
   * Retrieves a single alert by identifier and returns its representation.
   *
   * @param req - The incoming request.
   * @param res - The response used to send the alert payload.
   * @param next - The next middleware function for error handling.
   */
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = await this.service.getById(req.params.id);
      const response = AlertPresenter.toResponse(alert);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves all alerts and returns their representations.
   *
   * @param _req - The incoming request (unused).
   * @param res - The response used to send the alerts payload.
   * @param next - The next middleware function for error handling.
   */
  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const alerts = await this.service.getAll();
      const response = alerts.map(AlertPresenter.toResponse);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Returns the count of unread alerts.
   *
   * @param _req - The incoming request (unused).
   * @param res - The response used to send the count.
   * @param next - The next middleware function for error handling.
   */
  getUnreadCount = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await this.service.getUnreadCount();
      res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Registers the response as an SSE client for real-time alerts.
   *
   * @param _req - The incoming request (unused).
   * @param res - The response registered as an SSE client.
   * @param next - The next middleware function for error handling.
   */
  subscribe = (_req: Request, res: Response, next: NextFunction) => {
    try {
      this.sse.addClient(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates the read state of an alert based on request payload.
   *
   * @param req - The incoming request containing the read DTO.
   * @param res - The response used to send the result.
   * @param next - The next middleware function for error handling.
   */
  updateReadState = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateReadStateAlertSchema.parse(req.body);
      if (dto.read) {
        await this.service.markAsRead(req.params.id);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletes a single alert by identifier.
   *
   * @param req - The incoming request.
   * @param res - The response used to send the deletion result.
   * @param next - The next middleware function for error handling.
   */
  deleteOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteOne(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletes all alerts.
   *
   * @param _req - The incoming request (unused).
   * @param res - The response used to send the deletion result.
   * @param next - The next middleware function for error handling.
   */
  deleteAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteAll();
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
