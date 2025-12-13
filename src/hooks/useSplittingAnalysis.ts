import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SplittingFiltersState } from "@/components/data-exploitation/SplittingFilters";

export interface SplittingAnalysisResult {
    data: {
        contractingBody: string;
        totalCommitted: number;
    }[];
    debugStats: {
        totalFetched: number;
        yearMatches: number;
        cpvMatches: number;
        bodyMatches: number;
        finalMatches: number;
        filterPrefixUsed: string;
        sampleDbCPV: string;
        availableCPVs: string[];
        lotExistsWithoutCredit?: boolean;
        droppedReasons: {
            yearMismatch: number;
            cpvMismatch: number;
            bodyMismatch: number;
        };
    };
}

// Interface for the Supabase query result
interface CreditAnalysisRow {
    credit_committed_d: number | null;
    any: number;
    lot?: {
        formalization_date?: string | null;
        cpv_codes?: { code: string } | null;
        contract?: {
            contracting_body?: string;
            tipus_necessitat?: string;
        } | null;
    };
}

export const useSplittingAnalysis = (filters: SplittingFiltersState, enabled: boolean) => {
    return useQuery({
        queryKey: ["splitting-analysis", filters],
        enabled: enabled && filters.contractingBodies.length > 0 && !!filters.cpv && !!filters.needType,
        queryFn: async (): Promise<SplittingAnalysisResult> => {
            console.log("Starting analysis with filters:", filters);

            // Handle query date
            const queryDateStr = filters.queryDate || new Date().toISOString().split('T')[0];
            const queryDate = new Date(queryDateStr);
            const queryYear = queryDate.getFullYear();

            // Build the select string
            // We need to join with cpv_codes to get the real code
            const selectString = `
              credit_committed_d,
              any,
              lot:lots!inner (
                formalization_date,
                cpv_codes (
                    code
                ),
                contract:contracts!inner (
                  contracting_body,
                  tipus_necessitat
                )
              )
            `;

            // Fetch broader data (last 5 years) to debug what's available
            // Note: We fetch based on 'any' (budget year) for initial scope, but filtering will be on formalization_date
            const query = supabase
                .from("credits")
                .select(selectString)
                .gte("any", queryYear - 5);

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching analysis data:", error);
                throw error;
            }

            console.log(`Raw data fetched (last 5 years): ${data?.length} records`);

            // Initialize stats
            const stats = {
                totalFetched: data?.length || 0,
                yearMatches: 0,
                cpvMatches: 0,
                bodyMatches: 0,
                finalMatches: 0,
                filterPrefixUsed: "",
                sampleDbCPV: "",
                availableCPVs: [] as string[],
                lotExistsWithoutCredit: false,
                droppedReasons: {
                    yearMismatch: 0,
                    cpvMismatch: 0,
                    bodyMismatch: 0
                }
            };

            // Calculate CPV Prefix
            // 1. Get code (e.g. "90910000-9")
            // 2. Remove non-digits ("909100009") -> actually usually just first 8 are relevant
            // Let's take the first 8 digits if available
            const cleanFilterCPV = filters.cpv?.code.replace(/\D/g, '').substring(0, 8) || "";
            // 3. Remove trailing zeros to get the "significant prefix" (e.g. "90910000" -> "9091")
            // This allows "90910000" to match "90911200"
            let filterPrefix = cleanFilterCPV.replace(/0+$/, "");

            // If the prefix becomes empty (e.g. input was "00000000"), keep at least one digit or handle gracefully
            if (filterPrefix.length === 0 && cleanFilterCPV.length > 0) filterPrefix = cleanFilterCPV;

            stats.filterPrefixUsed = filterPrefix;

            // Aggregate data
            const aggregation: Record<string, number> = {};
            const uniqueCPVs = new Set<string>();

            // Initialize all selected bodies
            filters.contractingBodies.forEach(body => {
                aggregation[body] = 0;
            });

            (data as CreditAnalysisRow[]).forEach((item) => {
                const itemFormalizationDate = item.lot?.formalization_date ? new Date(item.lot.formalization_date) : null;

                // Access nested CPV code from relation
                // Supabase returns single object for one-to-one/many-to-one if not array
                // But lots->cpv_codes is likely many-to-one (lot has one cpv_code)
                // Check if it returns an array or object. Based on query structure `cpv_codes(code)`, it might be an object or array depending on relation.
                // Assuming it returns an object or null based on typical FK.
                const cpvData = item.lot?.cpv_codes;
                const itemCPV = cpvData?.code;

                const itemBody = item.lot?.contract?.contracting_body;
                const amount = Number(item.credit_committed_d) || 0;

                // Collect unique CPVs for debug
                if (itemCPV) {
                    uniqueCPVs.add(itemCPV);
                }

                // Capture a sample DB CPV for debugging if we haven't yet
                if (!stats.sampleDbCPV && itemCPV) {
                    stats.sampleDbCPV = itemCPV;
                }

                // 1. Check Year/Need Type based on Formalization Date
                let yearMatch = false;
                if (itemFormalizationDate) {
                    if (filters.needType === "Puntual") {
                        // Puntual: Formalization date must be in the current year of the query date (Jan 1st to Query Date)
                        const startOfYear = new Date(queryYear, 0, 1);
                        yearMatch = itemFormalizationDate >= startOfYear && itemFormalizationDate <= queryDate;
                    } else if (filters.needType === "Recurrent") {
                        // Recurrent: Formalization date must be in the last 5 years from query date
                        const fiveYearsAgo = new Date(queryDate);
                        fiveYearsAgo.setFullYear(queryDate.getFullYear() - 5);
                        yearMatch = itemFormalizationDate >= fiveYearsAgo && itemFormalizationDate <= queryDate;
                    }
                } else {
                    // Fallback if no formalization date? For now, strict check means it fails.
                    // Or we could fallback to 'any' (budget year) but user specifically asked for formalization date.
                    yearMatch = false;
                }

                // 2. Check CPV - Significant Prefix Matching
                let cpvMatch = false;
                if (itemCPV) {
                    const cleanDbCPV = itemCPV.replace(/\D/g, '');
                    // Check if DB CPV starts with the filter prefix
                    if (cleanDbCPV.startsWith(filterPrefix)) {
                        cpvMatch = true;
                    }
                }

                // 3. Check Contracting Body
                const bodyMatch = itemBody && filters.contractingBodies.includes(itemBody);

                // Update stats
                if (yearMatch) stats.yearMatches++;
                else stats.droppedReasons.yearMismatch++;

                if (cpvMatch) stats.cpvMatches++;
                else stats.droppedReasons.cpvMismatch++;

                if (bodyMatch) stats.bodyMatches++;
                else stats.droppedReasons.bodyMismatch++;

                if (yearMatch && cpvMatch && bodyMatch) {
                    aggregation[itemBody] = (aggregation[itemBody] || 0) + amount;
                    stats.finalMatches++;
                }
            });

            stats.availableCPVs = Array.from(uniqueCPVs); // Show all available CPVs

            // Secondary Check: If no matches found, check if the Lot exists at all (without credits)
            if (stats.finalMatches === 0 && filterPrefix) {
                // Check using the relation to cpv_codes
                // Note: We need to be careful with the query here.
                // We want lots that have a cpv_code starting with the prefix.
                const { data: lotData } = await supabase
                    .from('lots')
                    .select('id, cpv_codes!inner(code)')
                    .ilike('cpv_codes.code', `${filterPrefix}%`)
                    .limit(1);

                if (lotData && lotData.length > 0) {
                    stats.lotExistsWithoutCredit = true;
                    console.log("Found Lot without credit matching CPV:", lotData[0]);
                }
            }

            console.log("Analysis Stats:", stats);

            const resultData = Object.entries(aggregation).map(([contractingBody, totalCommitted]) => ({
                contractingBody,
                totalCommitted
            }));

            return {
                data: resultData,
                debugStats: stats
            };
        },
    });
};
