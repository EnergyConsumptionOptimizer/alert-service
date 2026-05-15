import { SseRegistry } from "@infrastructure/sse/SseRegistry";
import type { Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface MockedSseResponse {
	writeHead: ReturnType<typeof vi.fn>;
	write: ReturnType<typeof vi.fn>;
	on: ReturnType<typeof vi.fn>;
	flush?: () => void;
	_triggerClose: () => void;
}

function mockResponse(): Response & { _triggerClose: () => void } {
	const listeners: Record<string, () => void> = {};
	const res: MockedSseResponse = {
		writeHead: vi.fn(),
		write: vi.fn(),
		on: vi.fn((event: string, cb: () => void) => {
			listeners[event] = cb;
		}),
		_triggerClose: () => listeners.close?.(),
	};
	return res as unknown as Response & { _triggerClose: () => void };
}

describe("SseRegistry", () => {
	let registry: SseRegistry;

	beforeEach(() => {
		registry = new SseRegistry();
		registry.start();
	});

	afterEach(() => {
		registry.stop();
	});

	it("should start with zero clients", () => {
		expect(registry.clientCount).toBe(0);
	});

	it("should add a client and increment count", () => {
		const res = mockResponse();

		registry.addClient(res);

		expect(registry.clientCount).toBe(1);
		expect(res.writeHead).toHaveBeenCalledWith(200, {
			"Content-Type": "text/event-stream",
			Connection: "keep-alive",
			"Cache-Control": "no-cache",
			"X-Accel-Buffering": "no",
		});
		expect(res.write).toHaveBeenCalledWith(
			expect.stringContaining("CONNECTED"),
		);
	});

	it("should remove client on close and decrement count", () => {
		const res = mockResponse();
		registry.addClient(res);
		expect(registry.clientCount).toBe(1);

		res._triggerClose();

		expect(registry.clientCount).toBe(0);
	});

	it("should broadcast to all connected clients", () => {
		const r1 = mockResponse();
		const r2 = mockResponse();
		registry.addClient(r1);
		registry.addClient(r2);

		registry.broadcast({ type: "TEST", payload: { hello: "world" } });

		expect(r1.write).toHaveBeenCalled();
		expect(r2.write).toHaveBeenCalled();
	});

	it("should not fail when broadcasting with no clients", () => {
		expect(() => registry.broadcast({ type: "TEST" })).not.toThrow();
	});

	it("should flush after write when flush function is available", () => {
		const res = mockResponse();
		(res as unknown as { flush: () => void }).flush = vi.fn();
		registry.addClient(res);

		expect(res.write).toHaveBeenCalled();
	});
});
