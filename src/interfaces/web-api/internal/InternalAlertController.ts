import { Request, Response, NextFunction } from "express";
import { CreateAlertSchema } from "@presentation/CreateAlertSchema";
import { AlertService } from "@application/AlertService";

/**
 * Handles internal API requests for creating alerts.
 */
export class InternalAlertController {
  /**
   * @param service - The alert application service used to create alerts.
   */
  constructor(private readonly service: AlertService) {}

  /**
   * Creates a new alert from request body and returns its identifier.
   *
   * @param req - The incoming request.
   * @param res - The response used to send the created identifier.
   * @param next - The next middleware function for error handling.
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreateAlertSchema.parse(req.body);
      const alertId = await this.service.createAndSend(dto);
      res.status(201).json({
        success: true,
        data: { id: alertId.toString() },
      });
    } catch (error) {
      next(error);
    }
  };
}
