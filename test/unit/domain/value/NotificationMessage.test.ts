import { InvalidNotificationMessageError } from "@domain/errors";
import { NotificationMessage } from "@domain/value/NotificationMessage";

describe("NotificationMessage Value Object", () => {
	describe("of() factory", () => {
		it.each([
			{
				scenario: "a valid message",
				input: "Threshold breached: 150 exceeds 100",
				expected: "Threshold breached: 150 exceeds 100",
			},
			{
				scenario: "surrounding whitespace",
				input: "   Short message   ",
				expected: "Short message",
			},
		])("should successfully create when provided $scenario", ({
			input,
			expected,
		}) => {
			const result = NotificationMessage.of(input);
			expect(result).toBeInstanceOf(NotificationMessage);
			expect((result as NotificationMessage).value).toBe(expected);
		});

		it.each([
			{ scenario: "an empty string", input: "" },
			{ scenario: "only whitespace", input: "    " },
		])("should return InvalidNotificationMessageError when provided $scenario", ({
			input,
		}) => {
			const result = NotificationMessage.of(input);
			expect(result).toBeInstanceOf(InvalidNotificationMessageError);
			if (result instanceof InvalidNotificationMessageError) {
				expect(result.code).toBe("NOTIFICATION_MESSAGE_EMPTY");
			}
		});
	});

	describe("equals()", () => {
		it.each([
			{
				scenario: "the same underlying value",
				val1: "Gas limit exceeded",
				val2: "Gas limit exceeded",
				expected: true,
			},
			{
				scenario: "different underlying values",
				val1: "Gas limit exceeded",
				val2: "Electricity limit exceeded",
				expected: false,
			},
		])("should return $expected when instances hold $scenario", ({
			val1,
			val2,
			expected,
		}) => {
			expect(
				(NotificationMessage.of(val1) as NotificationMessage).equals(
					NotificationMessage.of(val2) as NotificationMessage,
				),
			).toBe(expected);
		});
	});
});
