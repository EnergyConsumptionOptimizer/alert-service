import { NodeCryptoIdGenerator } from "@infrastructure/utils/NodeCryptoIdGenerator";
import { describe, expect, it } from "vitest";

describe("NodeCryptoIdGenerator", () => {
	it("should generate a non-empty string", () => {
		const generator = new NodeCryptoIdGenerator();

		const id = generator.generate();

		expect(id).toEqual(expect.any(String));
		expect(id.length).toBeGreaterThan(0);
	});

	it("should generate unique values across multiple calls", () => {
		const generator = new NodeCryptoIdGenerator();
		const ids = new Set<string>();

		for (let i = 0; i < 100; i++) {
			ids.add(generator.generate());
		}

		expect(ids.size).toBe(100);
	});
});
