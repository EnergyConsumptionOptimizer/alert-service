import { AlertRepository } from "@domain/port/AlertRepository";
import { AlertId } from "@domain/value/AlertId";
import { BreachDetails } from "@domain/value/BreachDetails";
import { Alert } from "@domain/Alert";
import { AlertSender } from "@application/port/AlertSender";
import { CreateAlertCommand } from "@application/port/CreateAlertCommand";
import { AlertNotFoundError } from "@application/errors";

/**
 * Coordinates alert creation, delivery, and repository operations.
 *
 * @param repository - The persistence implementation for alerts.
 * @param sender - The transport responsible for sending alerts.
 */
export class AlertService {
  constructor(
    private readonly repository: AlertRepository,
    private readonly sender: AlertSender,
  ) {}

  /**
   * Creates an alert from the given command, attempts delivery, and persists state.
   *
   * @param command - The data required to create the alert.
   * @returns The created alert identifier.
   */
  async createAndSend(command: CreateAlertCommand): Promise<AlertId> {
    const details = new BreachDetails(
      command.thresholdId,
      command.thresholdName,
      command.utilityType,
      command.thresholdType,
      command.periodType,
      command.limitValue,
      command.detectedValue,
    );

    const alert = Alert.create(details);
    await this.repository.save(alert);

    try {
      await this.sender.send(alert);
      alert.markAsSent();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      alert.markAsFailed(reason);
    }
    await this.repository.save(alert);

    return alert.id;
  }

  /**
   * Retrieves an alert by its string identifier.
   *
   * @param id - The string identifier of the alert.
   * @returns The `Alert` instance when found.
   * @throws If no alert exists for the provided identifier.
   */
  async getById(id: string): Promise<Alert> {
    const alertId = AlertId.of(id);
    const alert = await this.repository.findById(alertId);
    if (!alert) {
      throw new AlertNotFoundError(id);
    }
    return alert;
  }
  async getAll(): Promise<Alert[]> {
    return this.repository.findAll();
  }

  async getUnreadCount(): Promise<number> {
    return this.repository.countUnread();
  }

  async markAsRead(id: string): Promise<void> {
    const alert = await this.getById(id);
    alert.markAsRead();
    await this.repository.save(alert);
  }

  async deleteOne(id: string): Promise<void> {
    const alertId = AlertId.of(id);
    await this.repository.deleteOne(alertId);
  }

  async deleteAll(): Promise<void> {
    await this.repository.deleteAll();
  }
}
