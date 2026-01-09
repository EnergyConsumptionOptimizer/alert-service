const UNITS: Record<string, string> = {
  WATER: "Smc",
  ELECTRICITY: "kWh",
  GAS: "Smc",
};

/**
 * Encapsulates threshold breach details and presentation helpers.
 *
 * @param thresholdId - The identifier of the threshold.
 * @param thresholdName - The human-readable threshold name.
 * @param utilityType - The utility type (e.g., WATER, GAS).
 * @param thresholdType - The threshold type identifier.
 * @param periodType - The optional period type for the threshold.
 * @param limitValue - The configured limit value for the threshold.
 * @param detectedValue - The measured value that triggered the breach.
 */
export class BreachDetails {
  constructor(
    public readonly thresholdId: string,
    public readonly thresholdName: string,
    public readonly utilityType: string,
    public readonly thresholdType: string,
    public readonly periodType: string | undefined,
    public readonly limitValue: number,
    public readonly detectedValue: number,
  ) {}

  /**
   * Builds a human-readable message describing the breach.
   *
   * @returns A formatted message containing detected and limit values.
   */
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
