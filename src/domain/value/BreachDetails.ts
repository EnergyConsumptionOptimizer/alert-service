const UNITS: Record<string, string> = {
  WATER: "Smc",
  ELECTRICITY: "kWh",
  GAS: "Smc",
};

export class BreachDetails {
  constructor(
    public readonly thresholdId: string,
    public readonly thresholdName: string,
    public readonly utilityType: string,
    public readonly thresholdType: string,
    public readonly periodType: string,
    public readonly limitValue: number,
    public readonly detectedValue: number,
  ) {}

  public getFormattedMessage(): string {
    const unit = this.getUnit();
    const diff = (this.detectedValue - this.limitValue).toFixed(2);

    return (
      `The '${this.thresholdName}' threshold was exceeded by ${diff}${unit}.\n` +
      `Detected: ${this.detectedValue}${unit}\n` +
      `Limit:    ${this.limitValue}${unit}`
    );
  }

  private getUnit(): string {
    return UNITS[this.utilityType.toUpperCase()] ?? "";
  }
}
