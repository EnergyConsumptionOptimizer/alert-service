import { AlertId } from "@domain/value/AlertId";
import { Alert } from "@domain/Alert";

/**
 * Persists and retrieves `Alert` aggregates.
 */
export interface AlertRepository {
  /**
   * Persists the given alert.
   *
   * @param alert - The alert to persist.
   */
  save(alert: Alert): Promise<void>;

  /**
   * Retrieves an alert by its identifier.
   *
   * @param id - The alert identifier to search for.
   * @returns The `Alert` if found, otherwise `null`.
   */
  findById(id: AlertId): Promise<Alert | null>;

  /**
   * Retrieves all stored alerts.
   *
   * @returns An array of all `Alert` instances.
   */
  findAll(): Promise<Alert[]>;

  /**
   * Counts unread alerts.
   *
   * @returns The number of unread alerts.
   */
  countUnread(): Promise<number>;

  /**
   * Deletes a single alert by identifier.
   *
   * @param id - The identifier of the alert to delete.
   */
  deleteOne(id: AlertId): Promise<void>;

  /**
   * Deletes all stored alerts.
   */
  deleteAll(): Promise<void>;
}
