import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	type ComponentTestContext,
	clearDatabase,
	composeAppForComponentTest,
	startMongo,
	stopMongo,
} from "./setup";

const ADMIN = {
	"X-User-Id": "admin-id",
	"X-User-Role": "ADMIN",
	"X-User-Username": "admin",
};

const HOUSEHOLD = {
	"X-User-Id": "user-id",
	"X-User-Role": "HOUSEHOLD",
	"X-User-Username": "bob",
};

const NO_AUTH = {};

describe("Notification Component", () => {
	let ctx: ComponentTestContext;

	beforeAll(startMongo);
	afterAll(stopMongo);

	beforeEach(async () => {
		await clearDatabase();
		ctx = await composeAppForComponentTest();
	});

	describe("Feature: Notifications created from threshold breach", () => {
		describe("Scenario: Threshold breach creates a notification", () => {
			it("Given a threshold breach, When the event is processed, Then a notification is persisted", async () => {
				const result = await ctx.notificationService.create({
					sourceId: "th-1",
					message: "Threshold breached: 150 exceeds 100",
				});

				expect(result).not.toBeInstanceOf(Error);
				if (result instanceof Error) return;

				expect(result.id).toEqual(expect.any(String));
				expect(result.sourceId).toBe("th-1");
				expect(result.state).toBe("SENT");

				const getRes = await request(ctx.app)
					.get(`/api/notifications/${result.id}`)
					.set(ADMIN);

				expect(getRes.status).toBe(StatusCodes.OK);
				expect(getRes.body.id).toBe(result.id);
				expect(getRes.body.sourceId).toBe("th-1");
			});
		});

		describe("Scenario: Spam suppression for same source within 1h", () => {
			it("Given a recent unread notification for source, When another breach occurs, Then the notification is suppressed", async () => {
				const first = await ctx.notificationService.create({
					sourceId: "th-spam",
					message: "First breach",
				});
				expect(first).not.toBeInstanceOf(Error);

				await ctx.notificationService.create({
					sourceId: "th-spam",
					message: "Second breach",
				});

				const getRes = await request(ctx.app)
					.get("/api/notifications")
					.set(ADMIN);

				expect(getRes.status).toBe(StatusCodes.OK);
				expect(getRes.body).toHaveLength(1);
				expect(getRes.body[0].sourceId).toBe("th-spam");
			});
		});

		describe("Scenario: No suppression after marking as read", () => {
			it("Given a notification marked as read, When another breach for same source, Then it is not suppressed", async () => {
				const first = await ctx.notificationService.create({
					sourceId: "th-read",
					message: "First breach",
				});
				if (first instanceof Error) return;

				await ctx.notificationService.markAsRead(first.id);

				await ctx.notificationService.create({
					sourceId: "th-read",
					message: "Second breach",
				});

				const getRes = await request(ctx.app)
					.get("/api/notifications")
					.set(ADMIN);

				expect(getRes.status).toBe(StatusCodes.OK);
				expect(getRes.body).toHaveLength(2);
			});
		});
	});

	describe("Feature: View notification history", () => {
		describe("Scenario: List all notifications", () => {
			it("Given notifications in the database, When any user requests list, Then returns 200 sorted by newest first", async () => {
				await ctx.notificationService.create({
					sourceId: "th-a",
					message: "First",
				});
				await ctx.notificationService.create({
					sourceId: "th-b",
					message: "Second",
				});

				const res = await request(ctx.app)
					.get("/api/notifications")
					.set(HOUSEHOLD);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body).toHaveLength(2);
			});

			it("Given no notifications, When user requests list, Then returns 200 with empty array", async () => {
				const res = await request(ctx.app).get("/api/notifications").set(ADMIN);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body).toEqual([]);
			});
		});
	});

	describe("Feature: View notification details", () => {
		describe("Scenario: Retrieve existing notification", () => {
			it("Given a notification exists, When user requests by ID, Then returns 200 with details", async () => {
				const created = await ctx.notificationService.create({
					sourceId: "th-detail",
					message: "Detail test",
				});
				if (created instanceof Error) return;

				const res = await request(ctx.app)
					.get(`/api/notifications/${created.id}`)
					.set(HOUSEHOLD);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.id).toBe(created.id);
				expect(res.body.sourceId).toBe("th-detail");
				expect(res.body.message).toBe("Detail test");
				expect(res.body.state).toBeDefined();
				expect(res.body.createdAt).toBeDefined();
				expect(res.body.isRead).toBe(false);
			});
		});

		describe("Scenario: Non-existent notification", () => {
			it("Given no notification with that ID, When user requests, Then returns 404", async () => {
				const res = await request(ctx.app)
					.get("/api/notifications/nonexistent-id")
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.NOT_FOUND);
				expect(res.body.code).toBe("RESOURCE_NOT_FOUND");
			});
		});
	});

	describe("Feature: Mark notification as read", () => {
		describe("Scenario: Mark unread notification as read", () => {
			it("Given an unread notification, When user marks as read, Then returns 204 and isRead becomes true", async () => {
				const created = await ctx.notificationService.create({
					sourceId: "th-read",
					message: "Read me",
				});
				if (created instanceof Error) return;

				const patchRes = await request(ctx.app)
					.patch(`/api/notifications/${created.id}/read`)
					.set(HOUSEHOLD);

				expect(patchRes.status).toBe(StatusCodes.NO_CONTENT);

				const getRes = await request(ctx.app)
					.get(`/api/notifications/${created.id}`)
					.set(ADMIN);

				expect(getRes.body.isRead).toBe(true);
				expect(getRes.body.readAt).not.toBeNull();
			});
		});

		describe("Scenario: Mark non-existent notification as read", () => {
			it("Given no notification with that ID, When user marks as read, Then returns 404", async () => {
				const res = await request(ctx.app)
					.patch("/api/notifications/nonexistent-id/read")
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.NOT_FOUND);
			});
		});
	});

	describe("Feature: Delete a notification", () => {
		describe("Scenario: Delete as admin", () => {
			it("Given a notification exists, When admin deletes, Then returns 204 and it no longer exists", async () => {
				const created = await ctx.notificationService.create({
					sourceId: "th-del",
					message: "Delete me",
				});
				if (created instanceof Error) return;

				const delRes = await request(ctx.app)
					.delete(`/api/notifications/${created.id}`)
					.set(ADMIN);

				expect(delRes.status).toBe(StatusCodes.NO_CONTENT);

				const getRes = await request(ctx.app)
					.get(`/api/notifications/${created.id}`)
					.set(ADMIN);

				expect(getRes.status).toBe(StatusCodes.NOT_FOUND);
			});
		});

		describe("Scenario: Delete as non-admin", () => {
			it("Given a notification exists, When household user deletes, Then returns 403", async () => {
				const created = await ctx.notificationService.create({
					sourceId: "th-del",
					message: "Delete me",
				});
				if (created instanceof Error) return;

				const res = await request(ctx.app)
					.delete(`/api/notifications/${created.id}`)
					.set(HOUSEHOLD);

				expect(res.status).toBe(StatusCodes.FORBIDDEN);
				expect(res.body.code).toBe("FORBIDDEN");
			});
		});
	});

	describe("Feature: Delete all notifications", () => {
		describe("Scenario: Delete all as admin", () => {
			it("Given multiple notifications, When admin deletes all, Then returns 204 and none remain", async () => {
				await ctx.notificationService.create({
					sourceId: "th-1",
					message: "First",
				});
				await ctx.notificationService.create({
					sourceId: "th-2",
					message: "Second",
				});
				await ctx.notificationService.create({
					sourceId: "th-3",
					message: "Third",
				});

				const delRes = await request(ctx.app)
					.delete("/api/notifications")
					.set(ADMIN);

				expect(delRes.status).toBe(StatusCodes.NO_CONTENT);

				const getRes = await request(ctx.app)
					.get("/api/notifications")
					.set(ADMIN);

				expect(getRes.body).toEqual([]);
			});
		});

		describe("Scenario: Delete all as non-admin", () => {
			it("Given notifications exist, When household user deletes all, Then returns 403", async () => {
				const res = await request(ctx.app)
					.delete("/api/notifications")
					.set(HOUSEHOLD);

				expect(res.status).toBe(StatusCodes.FORBIDDEN);
				expect(res.body.code).toBe("FORBIDDEN");
			});
		});
	});

	describe("Feature: See unread count", () => {
		describe("Scenario: Count unread notifications", () => {
			it("Given 2 unread and 1 read notification, When user requests count, Then returns correct number", async () => {
				const n1 = await ctx.notificationService.create({
					sourceId: "th-1",
					message: "Unread 1",
				});
				const n2 = await ctx.notificationService.create({
					sourceId: "th-2",
					message: "Unread 2",
				});
				const n3 = await ctx.notificationService.create({
					sourceId: "th-3",
					message: "Read me",
				});
				if (n1 instanceof Error || n2 instanceof Error || n3 instanceof Error)
					return;
				await ctx.notificationService.markAsRead(n3.id);

				const res = await request(ctx.app)
					.get("/api/notifications/unread-count")
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.count).toBe(2);
			});
		});

		describe("Scenario: All read", () => {
			it("Given all notifications are read, When user requests count, Then returns 0", async () => {
				const n1 = await ctx.notificationService.create({
					sourceId: "th-1",
					message: "Read",
				});
				if (n1 instanceof Error) return;
				await ctx.notificationService.markAsRead(n1.id);

				const res = await request(ctx.app)
					.get("/api/notifications/unread-count")
					.set(HOUSEHOLD);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.count).toBe(0);
			});
		});

		describe("Scenario: No notifications", () => {
			it("Given no notifications, When user requests count, Then returns 0", async () => {
				const res = await request(ctx.app)
					.get("/api/notifications/unread-count")
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.count).toBe(0);
			});
		});
	});

	describe("Feature: Subscribe to real-time notification stream", () => {
		describe("Scenario: Unauthenticated user cannot subscribe", () => {
			it("Given no auth headers, When subscribing to stream, Then returns 401", async () => {
				const res = await request(ctx.app)
					.get("/api/notifications/stream")
					.set(NO_AUTH);

				expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
			});
		});
	});

	describe("Feature: Authorization", () => {
		describe("Scenario: Missing auth headers", () => {
			it("Given no X-User-Id header, When accessing any endpoint, Then returns 401", async () => {
				const res = await request(ctx.app)
					.get("/api/notifications")
					.set(NO_AUTH);

				expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
				expect(res.body.code).toBe("UNAUTHORIZED");
			});
		});

		describe("Scenario: Health endpoint is public", () => {
			it("Given any user, When accessing health, Then returns 200 without auth", async () => {
				const res = await request(ctx.app).get("/health").set(NO_AUTH);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.status).toBe("ok");
			});
		});
	});
});
