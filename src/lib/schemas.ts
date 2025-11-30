import { z } from "zod";

export const contractSchema = z.object({
    name: z.string().min(1, "El nom és obligatori"),
    file_number: z.string().optional(),
    dossier_number: z.string().optional(),
    referencia_interna: z.string().optional(),
    tipus_necessitat: z.enum(["Puntual", "Recurrent"]),
    contracting_body: z.string().optional(),
    contact_responsible: z.string().optional(),
    award_procedure: z.string().optional(),
    contract_type: z.string().optional(),
    purpose: z.string().optional(),
    need_to_satisfy: z.string().optional(),
    observations: z.string().optional(),
    extendable: z.boolean().default(false),
    modifiable: z.boolean().default(false),
});

export type ContractFormValues = z.infer<typeof contractSchema>;

export const lotSchema = z.object({
    name: z.string().min(1, "El nom és obligatori"),
    cpv: z.string().optional(),
    awardee: z.string().optional(),
    awardee_email: z.string().email("Email invàlid").optional().or(z.literal("")),
    cif_nif: z.string().optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    formalization_date: z.date().optional(),
    observations: z.string().optional(),
});

export const creditSchema = z.object({
    organic_item: z.string().optional(),
    program_item: z.string().optional(),
    economic_item: z.string().optional(),
    credit_committed_d: z.number().min(0, "L'import no pot ser negatiu"),
    any: z.number().int().min(2000, "Any invàlid"),
});

export const invoiceSchema = z.object({
    invoice_number: z.string().min(1, "El número de factura és obligatori"),
    invoice_date: z.date(),
    base_amount: z.number(),
    vat_amount: z.number(),
});
