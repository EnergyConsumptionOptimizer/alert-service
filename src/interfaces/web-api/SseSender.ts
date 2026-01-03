import { Response } from "express";
import { AlertSender } from "@application/port/AlertSender";
import { Alert } from "@domain/Alert";
import * as AlertPresenter from "@interfaces/web-api/presenter/AlertPresenter";

interface SseResponse extends Response {
  flush?: () => void;
}

export class SseSender implements AlertSender {
  private readonly clients = new Set<SseResponse>();

  constructor() {
    setInterval(() => this.heartbeat(), 30_000).unref();
  }

  public async send(alert: Alert): Promise<void> {
    const payload = AlertPresenter.toResponse(alert);

    console.log(`[SseSender] Broadcasting Alert: ${payload.id}`);

    this.clients.forEach((client) =>
      this.write(client, { type: "NEW_ALERT", payload }),
    );
  }

  public addClient(res: Response): void {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    });

    const sseRes = res as SseResponse;
    this.write(sseRes, { type: "CONNECTED" });
    this.clients.add(sseRes);

    res.on("close", () => this.clients.delete(sseRes));
  }

  private write(client: SseResponse, data: unknown): void {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof client.flush === "function") client.flush();
  }

  private heartbeat(): void {
    this.clients.forEach((client) => client.write(": keep-alive\n\n"));
  }
}
