export class BaseDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidAlertIdError extends BaseDomainError {
  constructor(id: string, reason: string) {
    super(`Invalid alert ID format '${id}': ${reason}`);
  }
}
