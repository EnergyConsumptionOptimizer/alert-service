/**
 * Represents a generic domain error.
 *
 * @param message - The error message.
 */
export class BaseDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Indicates an invalid alert identifier was provided.
 *
 * @param id - The invalid identifier value.
 * @param reason - The reason the identifier is considered invalid.
 */
export class InvalidAlertIdError extends BaseDomainError {
  constructor(id: string, reason: string) {
    super(`Invalid alert ID format '${id}': ${reason}`);
  }
}
