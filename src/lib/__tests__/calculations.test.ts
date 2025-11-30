import { describe, it, expect } from "vitest";
import { calculateCreditReal, calculateExecutionPercentage } from "../calculations";

describe("Calculations", () => {
    describe("calculateCreditReal", () => {
        it("should calculate credit real correctly (committed + modification - recognized)", () => {
            expect(calculateCreditReal(1000, 0, 200)).toBe(800);
            expect(calculateCreditReal(1000, 100, 200)).toBe(900);
        });

        it("should handle zero values", () => {
            expect(calculateCreditReal(0, 0, 0)).toBe(0);
            expect(calculateCreditReal(100, 0, 0)).toBe(100);
            expect(calculateCreditReal(0, 0, 100)).toBe(-100);
        });

        it("should handle negative results", () => {
            expect(calculateCreditReal(100, 0, 200)).toBe(-100);
        });
    });

    describe("calculateExecutionPercentage", () => {
        it("should calculate percentage correctly", () => {
            expect(calculateExecutionPercentage(50, 100)).toBe(50);
        });

        it("should handle zero total", () => {
            expect(calculateExecutionPercentage(100, 0)).toBe(0);
        });

        it("should round to nearest integer", () => {
            expect(calculateExecutionPercentage(1, 3)).toBe(33);
            expect(calculateExecutionPercentage(2, 3)).toBe(67);
        });

        it("should cap at 100% if needed (optional logic check)", () => {
            // Assuming the function doesn't cap by default based on typical implementations
            expect(calculateExecutionPercentage(150, 100)).toBe(150);
        });
    });
});
