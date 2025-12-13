import { Database } from "@/integrations/supabase/types";

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export interface Contract extends Tables<'contracts'> {
    areas?: string[];
    centers?: string[];
    lots?: Lot[];
    centers_data?: { id: string; name: string }[];
    // Optimized view fields
    total_committed?: number;
    total_recognized?: number;
    total_real?: number;
    execution_percentage?: number;
    years?: number[];
    areas_names?: string[];
    centers_names?: string[];
}

export interface Lot extends Tables<'lots'> {
    credits?: Credit[];
    credit_real_total?: number;
    credit_committed_total?: number;
    cpv_code?: string;
    cpv_description?: string;
    // Year-filtered calculated fields
    lot_committed?: number;
    lot_recognized?: number;
    initial_amount?: number;
    // Overriding sort_order to be optional in frontend if needed, but it's in Tables now
}

export interface Credit extends Tables<'credits'> {
    invoices?: Invoice[];
    modificacio?: boolean;
    prorroga?: boolean;
}

export interface Invoice {
    id: string;
    credit_id: string;
    invoice_number: string;
    invoice_date: string; // ISO date string
    base_amount: number;
    vat_amount: number;
    total: number;
    center_id?: string | null;
    centers?: {
        name: string;
    };
    // New fields for OFI/REC
    organic_item?: string | null;
    program_item?: string | null;
    economic_item?: string | null;
    accounting_document_number?: string | null;
    economic_year?: number | null;
    projecte_inversio?: boolean | null;
    codi_projecte_inversio?: string | null;
    modificacio?: boolean | null;
    prorroga?: boolean | null;
    register_number?: string | null;
    cif_nif?: string | null;
    awardee?: string | null;
    expense_description?: string | null;
    invoice_period_start?: string | null;
    invoice_period_end?: string | null;
    contract_type?: string | null;
    price_justification?: string | null;
    non_compliance_justification?: string | null;
    accumulated_duration?: string | null;
    cpv_code?: string | null;
    cpv_description?: string | null;
    cpv_code_id?: string | null;
}

export type Area = Tables<'areas'>;

export type Center = Tables<'centers'>;

export interface ContractFilters {
    search: string;
    selectedAreas: string[];
    selectedCenters: string[];
    selectedContractTypes: string[];
    selectedAwardProcedures: string[];
    selectedYears: number[];
}
