export interface Contract {
    id: string;
    name: string;
    dossier_number: string;
    file_number: string;
    referencia_interna?: string;
    tipus_necessitat?: string;
    contracting_body?: string;
    contact_responsible?: string;
    award_procedure?: string;
    contract_type?: string;
    purpose?: string;
    start_date?: string;
    end_date?: string;
    extendable: boolean;
    modifiable: boolean;
    created_at: string;
    areas?: string[];
    centers?: string[];
    lots?: Lot[];
    centers_data?: { id: string; name: string }[];
}

export interface Lot {
    id: string;
    contract_id: string;
    name: string;
    awardee: string;
    email_adjudicatari?: string;
    cif_nif?: string;
    start_date?: string;
    end_date?: string;
    extension_start_date?: string;
    extension_end_date?: string;
    extension_communication_deadline?: string;
    observations?: string;
    cpv?: string;
    cpv_code_id?: string;
    cpv_code?: string;
    cpv_description?: string;
    created_at: string;
    credits?: Credit[];
    credit_real_total?: number;
}

export interface Credit {
    id: string;
    lot_id: string;
    organic_item: string;
    program_item: string;
    economic_item: string;
    credit_committed_d: number;
    credit_recognized_o: number;
    credit_real: number;
    modificacio_credit: number;
    percentage_modified?: number;
    codi_projecte_inversio?: string;
    projecte_inversio: boolean;
    accounting_document_number?: string;
    any: number;
    created_at: string;
    invoices?: Invoice[];
}

export interface Invoice {
    id: string;
    credit_id: string;
    invoice_number: string;
    invoice_date: string;
    base_amount: number;
    vat_amount: number;
    total: number;
    created_at: string;
    center_id?: string;
    centers?: {
        name: string;
    };
}

export interface Area {
    id: string;
    name: string;
}

export interface Center {
    id: string;
    name: string;
    area_id: string;
}

export interface ContractFilters {
    search: string;
    selectedAreas: string[];
    selectedCenters: string[];
    selectedContractTypes: string[];
    selectedAwardProcedures: string[];
    selectedYears: number[];
}
