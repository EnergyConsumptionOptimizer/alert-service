import { InvalidAlertIdError } from "@domain/errors";
import { randomUUID } from "node:crypto";

export class AlertId {
  private constructor(public readonly value: string) {}

  static create(): AlertId {
    return new AlertId(randomUUID());
  }

  static of(id: string): AlertId {
    const trimmedId = id?.trim();
    if (!trimmedId) {
      throw new InvalidAlertIdError(id, "Alert ID must not be empty");
    }
    return new AlertId(trimmedId);
  }

  equals(other: AlertId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
