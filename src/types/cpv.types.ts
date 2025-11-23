export interface CPVCode {
    id: string;
    code: string;
    code_numeric: string;
    check_digit: string;
    description_es: string;
    description_ca: string;
    contract_type: string;
    division: string;
    group_code: string;
    class_code: string;
    category_code: string;
    depth_level: number;
}

export interface CPVSearchParams {
    query?: string;
    contractType?: string;
    depthLevel?: number;
    parentCode?: string; // For drilling down (e.g., show children of division XX)
    limit?: number;
}
