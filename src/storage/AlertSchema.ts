import { Schema, model, InferSchemaType } from "mongoose";
import { AlertStatus } from "@domain/value/AlertStatus";

const AlertSchema = new Schema(
  {
    _id: { type: String, required: true },
    details: {
      thresholdId: { type: String, required: true },
      thresholdName: { type: String, required: true },
      utilityType: { type: String, required: true },
      thresholdType: { type: String, required: true },
      periodType: { type: String, required: false },
      limitValue: { type: Number, required: true },
      detectedValue: { type: Number, required: true },
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(AlertStatus),
      index: true,
    },
    createdAt: { type: Date, required: true },
    sentAt: { type: Date, required: false },
    readAt: { type: Date, required: false, default: null },
    failReason: { type: String, required: false },
  },
  {
    _id: false,
    timestamps: false,
    versionKey: false,
  },
);

/**
 * Mongoose document type for persisted alerts.
 */
export type AlertDocument = InferSchemaType<typeof AlertSchema>;

/**
 * Mongoose model for alerts collection.
 */
export const AlertModel = model("Alert", AlertSchema);
