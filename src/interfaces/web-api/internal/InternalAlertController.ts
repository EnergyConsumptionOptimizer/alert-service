import { Request, Response, NextFunction } from "express";
import { CreateAlertSchema } from "@presentation/CreateAlertSchema";
import { AlertService } from "@application/AlertService";
import { SseSender } from "@interfaces/web-api/SseSender";

export class InternalAlertController {
  constructor(
    private readonly service: AlertService,
    private readonly sse: SseSender,
  ) {}

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

  subscribe = (_req: Request, res: Response, next: NextFunction) => {
    try {
      this.sse.addClient(res);
    } catch (error) {
      next(error);
    }
  };
}
