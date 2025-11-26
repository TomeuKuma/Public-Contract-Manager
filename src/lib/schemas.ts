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
    extendable: z.boolean().default(false),
    modifiable: z.boolean().default(false),
});

export type ContractFormValues = z.infer<typeof contractSchema>;
