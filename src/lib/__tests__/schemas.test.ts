import { describe, it, expect } from "vitest";
import { contractSchema, lotSchema, creditSchema, invoiceSchema } from "../schemas";

describe("Zod Schemas", () => {
    describe("contractSchema", () => {
        it("should validate a correct contract", () => {
            const validContract = {
                name: "Contracte de neteja",
                dossier_number: "EXP-2024-001",
                file_number: "FILE-001",
                contracting_body: "Serveis Generals",
                award_procedure: "Obert",
                contract_type: "Serveis",
                start_date: new Date(),
                end_date: new Date(),
                tipus_necessitat: "Recurrent",
                extendable: false,
                modifiable: false,
            };
            const result = contractSchema.safeParse(validContract);
            expect(result.success).toBe(true);
        });

        it("should reject missing required fields", () => {
            const invalidContract = {
                name: "Contracte incomplet",
                // Missing other required fields
            };
            const result = contractSchema.safeParse(invalidContract);
            expect(result.success).toBe(false);
        });
    });

    describe("lotSchema", () => {
        it("should validate a correct lot", () => {
            const validLot = {
                name: "Lot 1",
                cpv: "90910000-9",
                awardee: "Empresa de Neteja SL",
                start_date: new Date(),
                end_date: new Date(),
            };
            const result = lotSchema.safeParse(validLot);
            expect(result.success).toBe(true);
        });
    });

    describe("creditSchema", () => {
        it("should validate a correct credit", () => {
            const validCredit = {
                organic_item: "ORG-01",
                program_item: "PROG-01",
                economic_item: "ECO-01",
                credit_committed_d: 1000,
                any: 2024,
            };
            const result = creditSchema.safeParse(validCredit);
            expect(result.success).toBe(true);
        });

        it("should reject negative amounts", () => {
            const invalidCredit = {
                organic_item: "ORG-01",
                program_item: "PROG-01",
                economic_item: "ECO-01",
                credit_committed_d: -100,
                any: 2024,
            };
            const result = creditSchema.safeParse(invalidCredit);
            expect(result.success).toBe(false);
        });
    });

    describe("invoiceSchema", () => {
        it("should validate a correct invoice", () => {
            const validInvoice = {
                invoice_number: "INV-001",
                invoice_date: new Date(),
                base_amount: 100,
                vat_amount: 21,
            };
            const result = invoiceSchema.safeParse(validInvoice);
            expect(result.success).toBe(true);
        });
    });
});
