import { describe, it, expect, vi, beforeEach } from "vitest";
import { getContractById } from "../contractService";
import { supabase } from "@/integrations/supabase/client";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe("contractService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getContractById", () => {
        it("should return a contract with nested data", async () => {
            const mockContract = {
                id: "123",
                name: "Test Contract",
                lots: [],
                contract_areas: [],
                contract_centers: [],
            };

            const mockSingle = vi.fn().mockResolvedValue({ data: mockContract, error: null });
            const mockOrder = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
            (supabase.from as any).mockImplementation(mockFrom);

            const result = await getContractById("123");

            expect(result).toEqual({
                data: {
                    ...mockContract,
                    areas: [],
                    centers: [],
                    centers_data: [],
                },
                error: null
            });
            expect(supabase.from).toHaveBeenCalledWith("contracts");
        });

        it("should handle fetch errors", async () => {
            const mockError = { message: "DB Error" };

            const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
            const mockOrder = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
            (supabase.from as any).mockImplementation(mockFrom);

            const result = await getContractById("123");
            expect(result.error).toBe(mockError.message);
            expect(result.data).toBeNull();
        });
    });
});
