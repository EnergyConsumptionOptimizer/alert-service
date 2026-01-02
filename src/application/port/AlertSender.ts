import { Alert } from "@domain/Alert";

export interface AlertSender {
  send(alert: Alert): Promise<void>;
}
