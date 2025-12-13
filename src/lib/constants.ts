export const CONTRACTING_BODIES = [
    "UFAG Residència Llar dels Ancians",
    "UFAG Residència La Bonanova",
    "UFAG Residència Bartomeu Quetglas",
    "UFAG Residència Huialfàs",
    "UFAG Residència Oms-Sant Miquel",
    "UFAG Residència Miquel Mir",
    "UFAG Residència Sant Josep",
    "UFAG Residència Son Caulelles",
    "UFAG Direcció de les llars del menor",
    "UFAG Coordinació dels centres d'inclusió social",
    "Presidència",
    "Vicepresidència",
    "Gerència",
] as const;

export const AWARD_PROCEDURES = [
    "Contracte obert",
    "Contracte menor AD",
    "Contracte menor ADO",
] as const;

export const CONTRACT_TYPES = [
    "Subministrament",
    "Servei",
    "Obra",
    "Concessió",
] as const;

export const CPV_DEPTH_LABELS = {
    1: "Divisió",
    2: "Grup",
    3: "Classe",
    4: "Categoria",
    5: "Subcategoria",
} as const;

export const CPV_DEPTH_COLORS = {
    1: "bg-blue-100 text-blue-800",
    2: "bg-green-100 text-green-800",
    3: "bg-yellow-100 text-yellow-800",
    4: "bg-orange-100 text-orange-800",
    5: "bg-gray-100 text-gray-800",
} as const;

export const OFI_REC_OPTIONS = ["OFI", "REC"] as const;

export const NEED_TYPES = ["Puntual", "Recurrent"] as const;
