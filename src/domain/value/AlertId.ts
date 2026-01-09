import { InvalidAlertIdError } from "@domain/errors";
import { randomUUID } from "node:crypto";

/**
 * Represents a strongly-typed alert identifier.
 */
export class AlertId {
  private constructor(public readonly value: string) {}

  /**
   * Creates a new random `AlertId`.
   *
   * @returns A new `AlertId` instance.
   */
  static create(): AlertId {
    return new AlertId(randomUUID());
  }

  /**
   * Constructs an `AlertId` from the provided string.
   *
   * @param id - The identifier string to wrap.
   * @returns The `AlertId` instance.
   * @throws If the provided `id` is empty or whitespace.
   */
  static of(id: string): AlertId {
    const trimmedId = id?.trim();
    if (!trimmedId) {
      throw new InvalidAlertIdError(id, "Alert ID must not be empty");
    }
    return new AlertId(trimmedId);
  }

  /**
   * Compares equality with another `AlertId`.
   *
   * @param other - The other identifier to compare.
   * @returns `true` when both identifiers match.
   */
  equals(other: AlertId): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the primitive string representation.
   *
   * @returns The identifier string.
   */
  toString(): string {
    return this.value;
  }
}
