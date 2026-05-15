import type { NotificationService } from "@application/ports/in/NotificationService";
import type { SseRegistry } from "@infrastructure/sse/SseRegistry";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export class NotificationController {
	readonly #notificationService: NotificationService;
	readonly #sseRegistry: SseRegistry;

	constructor(
		notificationService: NotificationService,
		sseRegistry: SseRegistry,
	) {
		this.#notificationService = notificationService;
		this.#sseRegistry = sseRegistry;
	}

	async getById(req: Request, res: Response) {
		const result = await this.#notificationService.getById(req.params.id);
		if (result instanceof Error) throw result;
		res.status(StatusCodes.OK).json(result);
	}

	async getAll(_req: Request, res: Response) {
		const notifications = await this.#notificationService.getAll();
		res.status(StatusCodes.OK).json(notifications);
	}

	async getUnreadCount(_req: Request, res: Response) {
		const count = await this.#notificationService.getUnreadCount();
		res.status(StatusCodes.OK).json({ count });
	}

	subscribe(_req: Request, res: Response): void {
		this.#sseRegistry.addClient(res);
	}

	async markAsRead(req: Request, res: Response) {
		const result = await this.#notificationService.markAsRead(req.params.id);
		if (result instanceof Error) throw result;
		res.sendStatus(StatusCodes.NO_CONTENT);
	}

	async deleteOne(req: Request, res: Response) {
		const result = await this.#notificationService.deleteOne(req.params.id);
		if (result instanceof Error) throw result;
		res.sendStatus(StatusCodes.NO_CONTENT);
	}

	async deleteAll(_req: Request, _res: Response) {
		await this.#notificationService.deleteAll();
		_res.sendStatus(StatusCodes.NO_CONTENT);
	}
}
