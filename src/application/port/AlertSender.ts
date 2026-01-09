import { Alert } from "@domain/Alert";

/**
 * Sends alerts to an external transport or delivery mechanism.
 */
export interface AlertSender {
  /**
   * Sends the provided alert.
   *
   * @param alert - The alert to send.
   */
  send(alert: Alert): Promise<void>;
}
