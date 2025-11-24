import { Database } from "@/integrations/supabase/types";

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export interface Contract extends Tables<'contracts'> {
    areas?: string[];
    centers?: string[];
    lots?: Lot[];
    centers_data?: { id: string; name: string }[];
}

export interface Lot extends Tables<'lots'> {
    credits?: Credit[];
    credit_real_total?: number;
    credit_committed_total?: number;
    cpv_code?: string;
    cpv_description?: string;
    // Overriding sort_order to be optional in frontend if needed, but it's in Tables now
}

export interface Credit extends Tables<'credits'> {
    invoices?: Invoice[];
}

export interface Invoice extends Tables<'invoices'> {
    centers?: {
        name: string;
    };
}

export interface Area extends Tables<'areas'> { }

export interface Center extends Tables<'centers'> { }

export interface ContractFilters {
    search: string;
    selectedAreas: string[];
    selectedCenters: string[];
    selectedContractTypes: string[];
    selectedAwardProcedures: string[];
    selectedYears: number[];
}
