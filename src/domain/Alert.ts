import { AlertStatus } from "./value/AlertStatus";
import { BreachDetails } from "./value/BreachDetails";
import { AlertId } from "./value/AlertId";
import { parseISO8601DateTime } from "./utils/dateUtils";

export class Alert {
  private constructor(
    public readonly id: AlertId,
    public readonly details: BreachDetails,
    public readonly createdAt: Date,
    private _status: AlertStatus,
    private _sentAt?: Date,
    private _failReason?: string,
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
  ): Alert {
    const validCreatedAt =
      typeof createdAt === "string"
        ? parseISO8601DateTime(createdAt)
        : createdAt;

    const validSentAt =
      typeof sentAt === "string" ? parseISO8601DateTime(sentAt) : sentAt;

    return new Alert(
      id,
      details,
      validCreatedAt,
      status,
      validSentAt,
      failReason,
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

  get status(): AlertStatus {
    return this._status;
  }
  get sentAt(): Date | undefined {
    return this._sentAt;
  }
  get failReason(): string | undefined {
    return this._failReason;
  }
}
