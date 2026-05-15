import { InvalidNotificationIdError } from "@domain/errors";
import { NotificationId } from "@domain/value/NotificationId";

describe("NotificationId Value Object", () => {
	describe("of() factory", () => {
		it.each([
			{ scenario: "a valid string", input: "notif-1", expected: "notif-1" },
			{
				scenario: "surrounding whitespace",
				input: "   notif-2   ",
				expected: "notif-2",
			},
		])("should successfully create when provided $scenario", ({
			input,
			expected,
		}) => {
			const result = NotificationId.of(input);
			expect(result).toBeInstanceOf(NotificationId);
			expect((result as NotificationId).value).toBe(expected);
		});

		it.each([
			{ scenario: "an empty string", input: "" },
			{ scenario: "only whitespace", input: "    " },
		])("should return InvalidNotificationIdError when provided $scenario", ({
			input,
		}) => {
			const result = NotificationId.of(input);
			expect(result).toBeInstanceOf(InvalidNotificationIdError);
			if (result instanceof InvalidNotificationIdError) {
				expect(result.code).toBe("NOTIFICATION_ID_EMPTY");
			}
		});
	});

	describe("equals()", () => {
		it.each([
			{
				scenario: "the same underlying value",
				val1: "alpha",
				val2: "alpha",
				expected: true,
			},
			{
				scenario: "different underlying values",
				val1: "alpha",
				val2: "beta",
				expected: false,
			},
		])("should return $expected when instances hold $scenario", ({
			val1,
			val2,
			expected,
		}) => {
			expect(
				(NotificationId.of(val1) as NotificationId).equals(
					NotificationId.of(val2) as NotificationId,
				),
			).toBe(expected);
		});
	});
});
