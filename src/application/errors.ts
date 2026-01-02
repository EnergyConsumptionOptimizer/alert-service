export class AlertNotFoundError extends Error {
  constructor(id: string) {
    super(`Alert with id ${id} not found`);
    this.name = "AlertNotFoundError";
  }
}
