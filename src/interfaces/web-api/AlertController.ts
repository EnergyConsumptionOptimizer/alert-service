import { Request, Response, NextFunction } from "express";
import { AlertService } from "@application/AlertService";
import * as AlertPresenter from "./presenter/AlertPresenter";
import { SseSender } from "@interfaces/web-api/SseSender";
import { UpdateReadStateAlertSchema } from "@presentation/CreateAlertSchema";

export class AlertController {
  constructor(
    private readonly service: AlertService,
    private readonly sse: SseSender,
  ) {}

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = await this.service.getById(req.params.id);
      const response = AlertPresenter.toResponse(alert);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const alerts = await this.service.getAll();
      const response = alerts.map(AlertPresenter.toResponse);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await this.service.getUnreadCount();
      res.status(200).json({ success: true, data: { count } });
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

  deleteOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteOne(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  deleteAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteAll();
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
