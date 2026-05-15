import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let replSet: MongoMemoryReplSet | undefined;

export async function startMongo(): Promise<void> {
	replSet = new MongoMemoryReplSet({
		replSet: { count: 1, storageEngine: "wiredTiger" },
	});
	await replSet.start();
	await mongoose.connect(replSet.getUri());
}

export async function stopMongo(): Promise<void> {
	await mongoose.disconnect();
	if (replSet) {
		await replSet.stop();
		replSet = undefined;
	}
}

export async function clearDatabase(): Promise<void> {
	const db = mongoose.connection.db;
	if (!db) return;
	const collections = await db.listCollections().toArray();
	await Promise.all(
		collections.map((col) => db.collection(col.name).deleteMany({})),
	);
}
