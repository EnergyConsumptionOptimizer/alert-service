import { AlertId } from "@domain/value/AlertId";
import { Alert } from "@domain/Alert";

export interface AlertRepository {
  save(alert: Alert): Promise<void>;
  findById(id: AlertId): Promise<Alert | null>;
  findAll(): Promise<Alert[]>;
  countUnread(): Promise<number>;
  deleteOne(id: AlertId): Promise<void>;
  deleteAll(): Promise<void>;
}
