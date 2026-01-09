/**
 * Command payload required to create an alert.
 */
export interface CreateAlertCommand {
  readonly thresholdId: string;
  readonly thresholdName: string;
  readonly utilityType: string;
  readonly thresholdType: string;
  readonly periodType?: string;
  readonly limitValue: number;
  readonly detectedValue: number;
}
