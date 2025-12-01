import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

export interface BulkUploadRow {
    // Contract fields
    name: string;
    file_number: string;
    dossier_number?: string;
    contract_type: string;
    award_procedure?: string;
    contracting_body?: string;
    need_type?: string;
    object_description?: string;
    need_to_satisfy?: string;
    observations?: string;
    areas?: string;
    centers?: string;

    // Lot fields
    lot_name?: string;
    cpv_code?: string;
    awardee?: string;
    cif_nif?: string;
    lot_start_date?: string;
    lot_end_date?: string;
    formalization_date?: string;
    lot_observations?: string;

    // Credit fields
    credit_year?: number;
    organic_item?: string;
    program_item?: string;
    economic_item?: string;
    credit_committed?: number;
}

export interface ValidationError {
    row: number;
    field: string;
    message: string;
}

export interface UploadResult {
    success: boolean;
    contractsCreated: number;
    lotsCreated: number;
    errors: ValidationError[];
}

/**
 * Generate and download Excel template for bulk contract upload
 */
export const generateTemplate = () => {
    const headers = [
        "Nom del contracte*",
        "Núm. d'expedient*",
        "Núm. de dossier",
        "Tipus de contracte*",
        "Procediment d'adjudicació",
        "Òrgan de contractació",
        "Tipus de necessitat",
        "Descripció de l'objecte",
        "Necessitat a satisfer",
        "Observacions",
        "Àrees",
        "Centres",
        "Nom del lot",
        "Codi CPV",
        "Adjudicatari",
        "CIF/NIF",
        "Data inici lot",
        "Data fi lot",
        "Data formalització",
        "Observacions lot",
        "Any",
        "Orgànica",
        "Programa",
        "Econòmica",
        "Crèdit compromès (€)"
    ];

    const exampleRow = [
        "Contracte exemple",
        "EXP-2024-001",
        "DOS-2024-001",
        "Servei",
        "Obert",
        "Gerència",
        "Puntual",
        "Descripció del contracte",
        "Necessitat exemple",
        "Observacions del contracte",
        "Àrea 1, Àrea 2",
        "Centre 1, Centre 2",
        "Lot 1",
        "45100000-8",
        "Empresa SL",
        "B12345678",
        "01/01/2024",
        "31/12/2024",
        "15/12/2023",
        "Observacions del lot",
        2024,
        "10100",
        "123A",
        "22000",
        1500.50
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contractes i Lots");

    XLSX.writeFile(wb, "plantilla_carrega_massiva_AD_ADO.xlsx");
};

/**
 * Parse date from DD/MM/YYYY format or Excel serial number to YYYY-MM-DD
 */
const parseDate = (dateInput: any): string | null => {
    if (!dateInput) return null;

    // Handle Date object
    if (dateInput instanceof Date) {
        return dateInput.toISOString().split('T')[0];
    }

    // Handle Excel serial number
    if (typeof dateInput === 'number') {
        // Excel base date is usually Dec 30 1899
        // (value - 25569) * 86400 * 1000 gives milliseconds since Unix epoch
        const date = new Date(Math.round((dateInput - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }

    // Handle string
    if (typeof dateInput === 'string') {
        const trimmed = dateInput.trim();
        if (trimmed === "") return null;

        // Check if it's already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }

        const parts = trimmed.split("/");
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
    }

    return null;
};

const normalizeHeader = (header: string): string => {
    return header.toLowerCase().replace(/[^a-z0-9]/g, "");
};

const getColumnValue = (row: any, headers: string[], targetHeader: string): any => {
    // Direct match
    if (row[targetHeader] !== undefined) return row[targetHeader];

    // Normalized match
    const normalizedTarget = normalizeHeader(targetHeader);
    const matchedHeader = headers.find(h => normalizeHeader(h) === normalizedTarget);

    if (matchedHeader && row[matchedHeader] !== undefined) {
        return row[matchedHeader];
    }

    return undefined;
};

/**
 * Parse Excel file and return rows
 */
export const parseExcelFile = async (file: File): Promise<BulkUploadRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    resolve([]);
                    return;
                }

                // Get actual headers from the first row keys
                const headers = Object.keys(jsonData[0] as object);

                const rows: BulkUploadRow[] = jsonData.map((row: any) => {
                    const getValue = (key: string) => getColumnValue(row, headers, key);

                    return {
                        name: getValue("Nom del contracte*") || "",
                        file_number: getValue("Núm. d'expedient*") || "",
                        dossier_number: getValue("Núm. de dossier"),
                        contract_type: getValue("Tipus de contracte*") || "",
                        award_procedure: getValue("Procediment d'adjudicació"),
                        contracting_body: getValue("Òrgan de contractació"),
                        need_type: getValue("Tipus de necessitat"),
                        object_description: getValue("Descripció de l'objecte"),
                        need_to_satisfy: getValue("Necessitat a satisfer"),
                        observations: getValue("Observacions"),
                        areas: getValue("Àrees"),
                        centers: getValue("Centres"),
                        lot_name: getValue("Nom del lot"),
                        cpv_code: getValue("Codi CPV"),
                        awardee: getValue("Adjudicatari"),
                        cif_nif: getValue("CIF/NIF"),
                        lot_start_date: getValue("Data inici lot"),
                        lot_end_date: getValue("Data fi lot"),
                        formalization_date: getValue("Data formalització"),
                        lot_observations: getValue("Observacions lot"),

                        // Credit fields
                        credit_year: getValue("Any"),
                        organic_item: getValue("Orgànica"),
                        program_item: getValue("Programa"),
                        economic_item: getValue("Econòmica"),
                        credit_committed: getValue("Crèdit compromès (€)"),
                    };
                });

                resolve(rows);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error("Error llegint el fitxer"));
        reader.readAsArrayBuffer(file);
    });
};

const validateRow = (row: BulkUploadRow, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    if (!row.name || !row.name.trim()) {
        errors.push({
            row: rowIndex,
            field: "Nom del contracte",
            message: "El nom del contracte és obligatori"
        });
    }

    if (!row.file_number || !row.file_number.trim()) {
        errors.push({
            row: rowIndex,
            field: "Núm. d'expedient",
            message: "El número d'expedient és obligatori"
        });
    }

    if (!row.contract_type || !row.contract_type.trim()) {
        errors.push({
            row: rowIndex,
            field: "Tipus de contracte",
            message: "El tipus de contracte és obligatori"
        });
    } else {
        const validTypes = ["Servei", "Subministrament", "Obra"];
        // Normalize for comparison
        const normalizedType = row.contract_type.trim();
        // Case insensitive check
        const match = validTypes.find(t => t.toLowerCase() === normalizedType.toLowerCase());

        if (!match) {
            errors.push({
                row: rowIndex,
                field: "Tipus de contracte",
                message: `El tipus de contracte ha de ser: ${validTypes.join(", ")}`
            });
        }
    }

    // Validate contracting_body if provided
    if (row.contracting_body && row.contracting_body.trim()) {
        const validContractingBodies = [
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
        ];
        const normalizedContractingBody = row.contracting_body.trim();
        const match = validContractingBodies.find(t => t === normalizedContractingBody);

        if (!match) {
            errors.push({
                row: rowIndex,
                field: "Òrgan de contractació",
                message: `L'òrgan de contractació ha de ser un dels valors vàlids. Utilitza la plantilla per veure les opcions.`
            });
        }
    }

    // Validate need_type if provided
    if (row.need_type && row.need_type.trim()) {
        const validNeedTypes = ["Puntual", "Recurrent"];
        const normalizedNeedType = row.need_type.trim();
        const match = validNeedTypes.find(t => t.toLowerCase() === normalizedNeedType.toLowerCase());

        if (!match) {
            errors.push({
                row: rowIndex,
                field: "Tipus de necessitat",
                message: `El tipus de necessitat ha de ser: ${validNeedTypes.join(", ")}`
            });
        }
    }

    return errors;
};

/**
 * Process bulk upload
 */
export const processUpload = async (rows: BulkUploadRow[]): Promise<UploadResult> => {
    const errors: ValidationError[] = [];
    let contractsCreated = 0;
    let lotsCreated = 0;

    try {
        // Validate all rows first
        rows.forEach((row, index) => {
            const rowErrors = validateRow(row, index + 2); // +2 because Excel is 1-indexed and has header
            errors.push(...rowErrors);
        });

        if (errors.length > 0) {
            return { success: false, contractsCreated: 0, lotsCreated: 0, errors };
        }

        // Group rows by file_number
        const contractGroups = new Map<string, BulkUploadRow[]>();
        rows.forEach(row => {
            if (!contractGroups.has(row.file_number)) {
                contractGroups.set(row.file_number, []);
            }
            contractGroups.get(row.file_number)!.push(row);
        });

        // Process each contract group
        for (const [fileNumber, contractRows] of contractGroups) {
            const firstRow = contractRows[0];

            // Lookup areas
            const areaIds: string[] = [];
            if (firstRow.areas) {
                const areaNames = firstRow.areas.split(",").map(a => a.trim());
                const { data: areasData } = await supabase
                    .from("areas")
                    .select("id, name")
                    .in("name", areaNames);

                if (areasData) {
                    areaIds.push(...areasData.map(a => a.id));
                }
            }

            // Lookup centers
            const centerIds: string[] = [];
            if (firstRow.centers) {
                const centerNames = firstRow.centers.split(",").map(c => c.trim());
                const { data: centersData } = await supabase
                    .from("centers")
                    .select("id, name")
                    .in("name", centerNames);

                if (centersData) {
                    centerIds.push(...centersData.map(c => c.id));
                }
            }

            // Create contract
            const { data: contract, error: contractError } = await supabase
                .from("contracts")
                .insert({
                    name: firstRow.name,
                    file_number: firstRow.file_number,
                    dossier_number: firstRow.dossier_number,
                    contract_type: firstRow.contract_type,
                    award_procedure: firstRow.award_procedure,
                    contracting_body: firstRow.contracting_body,
                    tipus_necessitat: firstRow.need_type,
                    purpose: firstRow.object_description,
                    need_to_satisfy: firstRow.need_to_satisfy,
                    observations: firstRow.observations,
                })
                .select()
                .single();

            if (contractError) {
                errors.push({
                    row: 0,
                    field: "contract",
                    message: `Error creant contracte ${fileNumber}: ${contractError.message}`
                });
                continue;
            }

            contractsCreated++;

            // Insert area associations
            if (areaIds.length > 0) {
                await supabase
                    .from("contract_areas")
                    .insert(areaIds.map(areaId => ({
                        contract_id: contract.id,
                        area_id: areaId
                    })));
            }

            // Insert center associations
            if (centerIds.length > 0) {
                await supabase
                    .from("contract_centers")
                    .insert(centerIds.map(centerId => ({
                        contract_id: contract.id,
                        center_id: centerId
                    })));
            }

            // Create lots
            for (let i = 0; i < contractRows.length; i++) {
                const lotRow = contractRows[i];

                // Skip if no lot name (Sense lot)
                if (!lotRow.lot_name || lotRow.lot_name.trim() === "") {
                    continue;
                }

                // Lookup CPV code
                let cpvCodeId = null;
                if (lotRow.cpv_code) {
                    const cpvCodeStr = String(lotRow.cpv_code);
                    const { data: cpvData } = await supabase
                        .from("cpv_codes")
                        .select("id")
                        .or(`code.eq.${cpvCodeStr},code_numeric.eq.${cpvCodeStr.split("-")[0]}`)
                        .maybeSingle();

                    if (cpvData) {
                        cpvCodeId = cpvData.id;
                    }
                }

                const { data: lot, error: lotError } = await supabase
                    .from("lots")
                    .insert({
                        contract_id: contract.id,
                        name: lotRow.lot_name,
                        cpv_code_id: cpvCodeId,
                        awardee: lotRow.awardee,
                        cif_nif: lotRow.cif_nif,
                        start_date: parseDate(lotRow.lot_start_date),
                        end_date: parseDate(lotRow.lot_end_date),
                        formalization_date: parseDate(lotRow.formalization_date),
                        observations: lotRow.lot_observations,
                        sort_order: i,
                    })
                    .select()
                    .single();

                if (lotError) {
                    errors.push({
                        row: i + 2,
                        field: "lot",
                        message: `Error creant lot: ${lotError.message}`
                    });
                } else {
                    lotsCreated++;

                    // Create credit if data is present
                    if (lotRow.credit_year && lotRow.credit_committed !== undefined) {
                        const { error: creditError } = await supabase
                            .from("credits")
                            .insert({
                                lot_id: lot.id,
                                any: Number(lotRow.credit_year),
                                organic_item: lotRow.organic_item ? String(lotRow.organic_item) : null,
                                program_item: lotRow.program_item ? String(lotRow.program_item) : null,
                                economic_item: lotRow.economic_item ? String(lotRow.economic_item) : null,
                                credit_committed_d: Number(lotRow.credit_committed),
                                credit_recognized_o: 0,
                                credit_real: 0,
                                prorroga: false,
                                modificacio: false
                            });

                        if (creditError) {
                            errors.push({
                                row: i + 2,
                                field: "credit",
                                message: `Error creant crèdit: ${creditError.message}`
                            });
                        }
                    }
                }
            }
        }

        return {
            success: errors.length === 0,
            contractsCreated,
            lotsCreated,
            errors
        };
    } catch (error: any) {
        return {
            success: false,
            contractsCreated,
            lotsCreated,
            errors: [{
                row: 0,
                field: "general",
                message: error.message || "Error procesant la càrrega"
            }]
        };
    }
};
