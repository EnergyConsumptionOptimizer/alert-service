import { NotificationStates } from "@domain/value/NotificationState";
import mongoose, { Schema } from "mongoose";

export interface NotificationDoc {
	_id: string;
	sourceId: string;
	message: string;
	state: string;
	createdAt: Date;
	sentAt?: Date;
	failedReason?: string;
	readAt?: Date;
}

const NotificationSchema = new Schema<NotificationDoc>(
	{
		_id: { type: String, required: true },
		sourceId: { type: String, required: true },
		message: { type: String, required: true },
		state: {
			type: String,
			enum: Object.values(NotificationStates),
			required: true,
		},
		createdAt: { type: Date, required: true },
		sentAt: { type: Date },
		failedReason: { type: String },
		readAt: { type: Date, default: null },
	},
	{ timestamps: false, versionKey: false },
);

NotificationSchema.index({ readAt: 1 });
NotificationSchema.index({ sourceId: 1, state: 1, readAt: 1 });

export const NotificationModel = mongoose.model<NotificationDoc>(
	"Notification",
	NotificationSchema,
	"notifications",
);
