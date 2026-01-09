import { AlertStatus } from "./value/AlertStatus";
import { BreachDetails } from "./value/BreachDetails";
import { AlertId } from "./value/AlertId";
import { parseISO8601DateTime } from "./utils/dateUtils";

/**
 * Represents an alert aggregate with breach details and lifecycle operations.
 *
 * @param id - The alert identifier.
 * @param details - The breach details associated with the alert.
 * @param createdAt - The timestamp when the alert was created.
 * @param _status - The current delivery status of the alert.
 * @param _sentAt - The timestamp when the alert was sent, if any.
 * @param _failReason - The failure reason when sending fails, if any.
 * @param _readAt - The timestamp when the alert was read, if any.
 */
export class Alert {
  private constructor(
    public readonly id: AlertId,
    public readonly details: BreachDetails,
    public readonly createdAt: Date,
    private _status: AlertStatus,
    private _sentAt?: Date,
    private _failReason?: string,
    private _readAt?: Date,
  ) {}

  static create(details: BreachDetails): Alert {
    const validCreatedAt = parseISO8601DateTime(new Date().toISOString());
    return new Alert(
      AlertId.create(),
      details,
      validCreatedAt,
      AlertStatus.PENDING,
    );
  }

  static restore(
    id: AlertId,
    details: BreachDetails,
    createdAt: Date | string,
    status: AlertStatus,
    sentAt?: Date | string,
    failReason?: string,
    readAt?: Date | string,
  ): Alert {
    const validCreatedAt =
      typeof createdAt === "string"
        ? parseISO8601DateTime(createdAt)
        : createdAt;

    const validSentAt =
      typeof sentAt === "string" ? parseISO8601DateTime(sentAt) : sentAt;

    const validReadAt =
      typeof readAt === "string" ? parseISO8601DateTime(readAt) : readAt;

    return new Alert(
      id,
      details,
      validCreatedAt,
      status,
      validSentAt,
      failReason,
      validReadAt,
    );
  }

  public markAsSent(): void {
    if (this._status === AlertStatus.SENT) return;

    this._status = AlertStatus.SENT;
    this._sentAt = new Date();
  }

  public markAsFailed(reason: string): void {
    this._status = AlertStatus.FAILED;
    this._failReason = reason;
  }

  public markAsRead(): void {
    if (this._readAt) return;
    this._readAt = new Date();
  }

  get status(): AlertStatus {
    return this._status;
  }
  get sentAt(): Date | undefined {
    return this._sentAt;
  }
  get failReason(): string | undefined {
    return this._failReason;
  }
  get readAt(): Date | undefined {
    return this._readAt;
  }
  get isRead(): boolean {
    return !!this._readAt;
  }
}
