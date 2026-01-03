import { Request, Response, NextFunction } from "express";
import { AlertService } from "@application/AlertService";
import * as AlertPresenter from "@interfaces/web-api/presenter/AlertPresenter";

export class AlertController {
  constructor(private readonly service: AlertService) {}

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
