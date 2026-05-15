import mongoose, { Schema } from "mongoose";

export interface InboxEventDoc {
	eventId: string;
	timestamp: Date;
}

const InboxEventSchema = new Schema<InboxEventDoc>({
	eventId: { type: String, required: true, unique: true },
	timestamp: { type: Date, required: true, default: Date.now },
});

InboxEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

export const InboxEventModel = mongoose.model<InboxEventDoc>(
	"InboxEvent",
	InboxEventSchema,
	"inboxevents",
);
