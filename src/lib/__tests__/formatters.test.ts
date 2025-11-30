import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate } from "../formatters";

describe("Formatters", () => {
    describe("formatCurrency", () => {
        it("should format numbers as EUR currency", () => {
            expect(formatCurrency(1000)).toContain("1.000,00");
            expect(formatCurrency(1000)).toContain("€");
        });

        it("should handle zero", () => {
            expect(formatCurrency(0)).toContain("0,00");
        });

        it("should handle null or undefined", () => {
            expect(formatDate(null)).toBe("-");
            expect(formatDate(undefined)).toBe("-");
        });
    });
});
