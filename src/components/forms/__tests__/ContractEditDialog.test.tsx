import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContractEditDialog } from "../ContractEditDialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock Supabase and hooks
vi.mock("@/integrations/supabase/client", () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockUpdate = vi.fn().mockReturnThis();
    const mockDelete = vi.fn().mockReturnThis();
    const mockInsert = vi.fn().mockResolvedValue({ data: [], error: null });

    return {
        supabase: {
            from: vi.fn(() => ({
                select: mockSelect,
                eq: mockEq,
                update: mockUpdate,
                delete: mockDelete,
                insert: mockInsert,
            })),
        },
    };
});

vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

vi.mock("@/hooks/useMasterData", () => ({
    useAreas: () => ({ data: [] }),
    useCenters: () => ({ data: [] }),
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

describe("ContractEditDialog", () => {
    const mockContract = {
        id: "1",
        name: "Test Contract",
        lots: [],
        contract_areas: [],
        contract_centers: [],
    };

    it("should render dialog content when open", () => {
        render(
            <ContractEditDialog
                open={true}
                onOpenChange={() => { }}
                contract={mockContract as any}
                onSuccess={() => { }}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText("Editar contracte")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Test Contract")).toBeInTheDocument();
    });

    it("should display validation errors for empty submission", async () => {
        render(
            <ContractEditDialog
                open={true}
                onOpenChange={() => { }}
                contract={{ ...mockContract, name: "" } as any}
                onSuccess={() => { }}
            />,
            { wrapper: createWrapper() }
        );

        const submitButton = screen.getByText("Guardar");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("El nom és obligatori")).toBeInTheDocument();
        });
    });
});
