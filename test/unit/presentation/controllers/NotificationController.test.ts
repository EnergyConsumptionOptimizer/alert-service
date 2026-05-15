import { NotificationNotFoundError } from "@application/errors";
import type {
	NotificationOutput,
	NotificationService,
} from "@application/ports/in/NotificationService";
import type { SseRegistry } from "@infrastructure/sse/SseRegistry";
import { NotificationController } from "@presentation/rest/controllers/NotificationController";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

function mockRequest(overrides?: Partial<Request>): Request {
	return {
		params: {},
		body: {},
		headers: {},
		on: vi.fn(),
		...overrides,
	} as Request;
}

function mockResponse(): Response {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		sendStatus: vi.fn().mockReturnThis(),
		locals: {} as Record<string, unknown>,
		headersSent: false,
	};
	return res as unknown as Response;
}

describe("NotificationController", () => {
	let notificationService: MockProxy<NotificationService>;
	let sseRegistry: MockProxy<SseRegistry>;
	let controller: NotificationController;

	const NOTIFICATION_OUTPUT: NotificationOutput = {
		id: "notif-1",
		sourceId: "source-1",
		message: "Something happened",
		state: "SENT",
		createdAt: "2025-01-01T00:00:00.000Z",
		sentAt: "2025-01-01T00:00:01.000Z",
		failedReason: null,
		readAt: null,
		isRead: false,
	};

	beforeEach(() => {
		notificationService = mock<NotificationService>();
		sseRegistry = mock<SseRegistry>();
		controller = new NotificationController(notificationService, sseRegistry);
	});

	describe("getById()", () => {
		it("should return notification with status 200 when found", async () => {
			notificationService.getById.mockResolvedValue(NOTIFICATION_OUTPUT);
			const req = mockRequest({ params: { id: "notif-1" } });
			const res = mockResponse();

			await controller.getById(req, res);

			expect(notificationService.getById).toHaveBeenCalledWith("notif-1");
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(NOTIFICATION_OUTPUT);
		});

		it("should throw NotificationNotFoundError when not found", async () => {
			const error = new NotificationNotFoundError("notif-1");
			notificationService.getById.mockResolvedValue(error);
			const req = mockRequest({ params: { id: "notif-1" } });
			const res = mockResponse();

			await expect(controller.getById(req, res)).rejects.toThrow(
				NotificationNotFoundError,
			);
		});
	});

	describe("getAll()", () => {
		it("should return all notifications with status 200", async () => {
			const notifications = [NOTIFICATION_OUTPUT];
			notificationService.getAll.mockResolvedValue(notifications);
			const req = mockRequest();
			const res = mockResponse();

			await controller.getAll(req, res);

			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(notifications);
		});

		it("should return empty array when no notifications exist", async () => {
			notificationService.getAll.mockResolvedValue([]);
			const req = mockRequest();
			const res = mockResponse();

			await controller.getAll(req, res);

			expect(res.json).toHaveBeenCalledWith([]);
		});
	});

	describe("getUnreadCount()", () => {
		it("should return the unread count", async () => {
			notificationService.getUnreadCount.mockResolvedValue(3);
			const req = mockRequest();
			const res = mockResponse();

			await controller.getUnreadCount(req, res);

			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith({ count: 3 });
		});
	});

	describe("markAsRead()", () => {
		it("should mark notification as read and return 204", async () => {
			notificationService.markAsRead.mockResolvedValue(undefined);
			const req = mockRequest({ params: { id: "notif-1" } });
			const res = mockResponse();

			await controller.markAsRead(req, res);

			expect(notificationService.markAsRead).toHaveBeenCalledWith("notif-1");
			expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
		});

		it("should throw NotificationNotFoundError when not found", async () => {
			const error = new NotificationNotFoundError("notif-1");
			notificationService.markAsRead.mockResolvedValue(error);
			const req = mockRequest({ params: { id: "notif-1" } });
			const res = mockResponse();

			await expect(controller.markAsRead(req, res)).rejects.toThrow(
				NotificationNotFoundError,
			);
		});
	});

	describe("deleteOne()", () => {
		it("should delete notification and return 204", async () => {
			notificationService.deleteOne.mockResolvedValue(undefined);
			const req = mockRequest({ params: { id: "notif-1" } });
			const res = mockResponse();

			await controller.deleteOne(req, res);

			expect(notificationService.deleteOne).toHaveBeenCalledWith("notif-1");
			expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
		});

		it("should throw NotificationNotFoundError when not found", async () => {
			const error = new NotificationNotFoundError("notif-1");
			notificationService.deleteOne.mockResolvedValue(error);
			const req = mockRequest({ params: { id: "notif-1" } });
			const res = mockResponse();

			await expect(controller.deleteOne(req, res)).rejects.toThrow(
				NotificationNotFoundError,
			);
		});
	});

	describe("deleteAll()", () => {
		it("should delete all notifications and return 204", async () => {
			const req = mockRequest();
			const res = mockResponse();

			await controller.deleteAll(req, res);

			expect(notificationService.deleteAll).toHaveBeenCalled();
			expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
		});
	});

	describe("subscribe()", () => {
		it("should add the response as an SSE client", () => {
			const req = mockRequest();
			const res = mockResponse();

			controller.subscribe(req, res);

			expect(sseRegistry.addClient).toHaveBeenCalledWith(res);
		});
	});
});
