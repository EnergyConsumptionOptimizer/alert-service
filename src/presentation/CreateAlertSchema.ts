import { z } from "zod";

export const CreateAlertSchema = z.object({
  thresholdId: z.string().min(1),
  thresholdName: z.string().min(1),
  utilityType: z.string().min(1),
  thresholdType: z.string().min(1),
  periodType: z.string().optional(),
  limitValue: z.number(),
  detectedValue: z.number(),
});

export type CreateAlertDto = z.infer<typeof CreateAlertSchema>;
