export interface CreateAlertCommand {
  readonly thresholdId: string;
  readonly thresholdName: string;
  readonly utilityType: string;
  readonly thresholdType: string;
  readonly periodType: string;
  readonly limitValue: number;
  readonly detectedValue: number;
}
