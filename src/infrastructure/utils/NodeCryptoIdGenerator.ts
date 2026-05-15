import { randomUUID } from "node:crypto";
import type { IdGenerator } from "@application/ports/out/IdGenerator";

export class NodeCryptoIdGenerator implements IdGenerator {
	generate(): string {
		return randomUUID();
	}
}
