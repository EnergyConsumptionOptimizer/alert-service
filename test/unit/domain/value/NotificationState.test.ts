import {
	type NotificationState,
	NotificationStates,
} from "@domain/value/NotificationState";

describe("NotificationStates", () => {
	it("should define the exact supported runtime state values", () => {
		expect(NotificationStates).toEqual({
			PENDING: "PENDING",
			SENT: "SENT",
			FAILED: "FAILED",
		});
	});

	it("should enforce strict literal typing for the NotificationState type", () => {
		expectTypeOf<NotificationState>().toEqualTypeOf<
			"PENDING" | "SENT" | "FAILED"
		>();
	});

	it("should prevent runtime mutation by being read-only", () => {
		expect(Object.isFrozen(NotificationStates.PENDING)).toBe(true);
	});
});
