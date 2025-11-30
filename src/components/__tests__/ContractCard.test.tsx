import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ContractCard from "../ContractCard";
import { BrowserRouter } from "react-router-dom";

// Mock child components to simplify testing
vi.mock("@/components/ui/card", () => ({
    Card: ({ children, className, ...props }: any) => <div className={`card ${className}`} {...props}>{children}</div>,
    CardHeader: ({ children }: any) => <div className="card-header">{children}</div>,
    CardContent: ({ children }: any) => <div className="card-content">{children}</div>,
    CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock("@/components/ui/badge", () => ({
    Badge: ({ children }: any) => <span className="badge">{children}</span>,
}));

const mockContract = {
    id: "1",
    name: "Test Contract",
    contract_type: "Serveis",
    award_procedure: "Obert",
    contracting_body: "Serveis Generals",
    file_number: "FILE-001",
    dossier_number: "EXP-001",
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    lots: [],
    contract_areas: [],
    contract_centers: [],
};

describe("ContractCard", () => {
    it("should render contract details", () => {
        render(
            <BrowserRouter>
                <ContractCard contract={mockContract as any} onClick={() => { }} />
            </BrowserRouter>
        );

        expect(screen.getByText("Test Contract")).toBeInTheDocument();
        expect(screen.getByText("FILE-001")).toBeInTheDocument();
    });

    it("should call onClick when card is clicked", () => {
        const onClick = vi.fn();
        render(
            <BrowserRouter>
                <ContractCard contract={mockContract as any} onClick={onClick} />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText("Test Contract"));
        expect(onClick).toHaveBeenCalled();
    });
});
