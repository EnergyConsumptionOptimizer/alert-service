/**
 * Error thrown when an alert cannot be found by identifier.
 *
 * @param id - The identifier that was not found.
 */
export class AlertNotFoundError extends Error {
  constructor(id: string) {
    super(`Alert with id ${id} not found`);
    this.name = "AlertNotFoundError";
  }
}
