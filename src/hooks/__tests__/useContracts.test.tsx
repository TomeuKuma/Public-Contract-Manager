import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useContracts } from "../useContracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as contractService from "@/lib/contractService";

// Mock contractService
vi.mock("@/lib/contractService", () => ({
    getContracts: vi.fn(),
    createContract: vi.fn(),
    deleteContract: vi.fn(),
}));

// Mock useToast
vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe("useContracts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fetch contracts successfully", async () => {
        const mockContracts = [
            { id: "1", name: "Contract 1" },
            { id: "2", name: "Contract 2" },
        ];

        (contractService.getContracts as any).mockResolvedValue({
            data: mockContracts,
            count: 2,
            error: null
        });

        const { result } = renderHook(() => useContracts(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.contracts).toEqual(mockContracts);
        expect(contractService.getContracts).toHaveBeenCalled();
    });

    it("should handle fetch errors", async () => {
        (contractService.getContracts as any).mockResolvedValue({
            data: null,
            count: 0,
            error: "Fetch error"
        });

        const { result } = renderHook(() => useContracts(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.error).toBeDefined());
    });
});
