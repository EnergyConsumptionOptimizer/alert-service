import type { Response } from "express";
import type { Logger } from "pino";

interface SseResponse extends Response {
	flush?: () => void;
}

const HEARTBEAT_INTERVAL_MS = 30_000;

export class SseRegistry {
	readonly #clients = new Set<SseResponse>();
	readonly #logger?: Logger;
	#heartbeatTimer?: NodeJS.Timeout;

	constructor(logger?: Logger) {
		this.#logger = logger;
	}

	start(): void {
		this.#heartbeatTimer = setInterval(
			() => this.#heartbeat(),
			HEARTBEAT_INTERVAL_MS,
		).unref();
	}

	stop(): void {
		if (this.#heartbeatTimer) {
			clearInterval(this.#heartbeatTimer);
			this.#heartbeatTimer = undefined;
		}
	}

	get clientCount(): number {
		return this.#clients.size;
	}

	addClient(res: Response): void {
		res.writeHead(200, {
			"Content-Type": "text/event-stream",
			Connection: "keep-alive",
			"Cache-Control": "no-cache",
			"X-Accel-Buffering": "no",
		});

		const sseRes = res as SseResponse;
		this.#write(sseRes, { type: "CONNECTED" });
		this.#clients.add(sseRes);

		res.on("close", () => {
			this.#clients.delete(sseRes);
			this.#logger?.debug(
				{ remaining: this.#clients.size },
				"SSE client disconnected",
			);
		});

		this.#logger?.info({ total: this.#clients.size }, "SSE client connected");
	}

	broadcast(data: Record<string, unknown>): void {
		this.#logger?.debug(
			{ clientCount: this.#clients.size },
			"Broadcasting to SSE clients",
		);
		const serialized = `data: ${JSON.stringify(data)}\n\n`;
		for (const client of this.#clients) {
			client.write(serialized);
			if (typeof client.flush === "function") client.flush();
		}
	}

	#write(client: SseResponse, data: unknown): void {
		client.write(`data: ${JSON.stringify(data)}\n\n`);
		if (typeof client.flush === "function") client.flush();
	}

	#heartbeat(): void {
		for (const client of this.#clients) {
			client.write(": keep-alive\n\n");
		}
	}
}
