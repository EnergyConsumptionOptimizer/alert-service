import { describe, it, expect } from "vitest";
import { InvalidAlertIdError } from "@domain/errors";
import { AlertId } from "@domain/value/AlertId";

describe("AlertId", () => {
  describe("create", () => {
    it("should generate a new id", () => {
      const alertId = AlertId.create();
      const alertIdParsed = alertId.value.trim();
      expect(alertIdParsed.length).toBeGreaterThan(0);
    });
  });

  describe("of", () => {
    it("should create an instance from a valid string", () => {
      const idString = "123-abc";
      const alertId = AlertId.of(idString);

      expect(alertId.value).toBe(idString);
    });

    it("should trim whitespace from the input", () => {
      const alertId = AlertId.of("  valid-id  ");
      expect(alertId.value).toBe("valid-id");
    });

    it("should throw InvalidAlertIdError if id is empty", () => {
      expect(() => AlertId.of("")).toThrow(InvalidAlertIdError);
      expect(() => AlertId.of("   ")).toThrow(InvalidAlertIdError);
    });
  });

  describe("equals", () => {
    it("should return true for IDs with the same value", () => {
      const id1 = AlertId.of("same-id");
      const id2 = AlertId.of("same-id");

      expect(id1.equals(id2)).toBe(true);
    });

    it("should return false for IDs with different values", () => {
      const id1 = AlertId.of("id-one");
      const id2 = AlertId.of("id-two");

      expect(id1.equals(id2)).toBe(false);
    });
  });
});
