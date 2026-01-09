import { z } from "zod";

/**
 * Validates payload for creating an alert.
 *
 * Used to parse and validate inbound create alert requests.
 */
export const CreateAlertSchema = z.object({
  thresholdId: z.string().min(1),
  thresholdName: z.string().min(1),
  utilityType: z.string().min(1),
  thresholdType: z.string().min(1),
  periodType: z.string().optional(),
  limitValue: z.number(),
  detectedValue: z.number(),
});

/**
 * Validates payload for updating the read state of an alert.
 */
export const UpdateReadStateAlertSchema = z.object({
  read: z.boolean(),
});
