import { supabase } from "@/integrations/supabase/client";

export interface ContractFilters {
  search: string;
  selectedAreas: string[];
  selectedCenters: string[];
  selectedContractTypes: string[];
  selectedAwardProcedures: string[];
}

export const getContracts = async (filters?: ContractFilters) => {
  try {
    let query = supabase
      .from("contracts")
      .select(`
        *,
        contract_areas!inner(area_id),
        contract_centers!inner(center_id),
        lots(
          id,
          name,
          credits(
            credit_real,
            credit_committed_d,
            modificacio_credit,
            credit_recognized_o
          )
        )
      `)
      .order("created_at", { ascending: false });

    // Apply area filter
    if (filters?.selectedAreas && filters.selectedAreas.length > 0) {
      query = query.in("contract_areas.area_id", filters.selectedAreas);
    }

    // Apply center filter
    if (filters?.selectedCenters && filters.selectedCenters.length > 0) {
      query = query.in("contract_centers.center_id", filters.selectedCenters);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate lot totals and apply search filter
    let processedData = data?.map((contract: any) => ({
      ...contract,
      lots: contract.lots?.map((lot: any) => ({
        ...lot,
        credit_real_total: lot.credits?.reduce(
          (sum: number, credit: any) => sum + ((Number(credit.credit_committed_d) || 0) + (Number(credit.modificacio_credit) || 0) - (Number(credit.credit_recognized_o) || 0)),
          0
        ),
      })),
    }));

    // Apply search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      processedData = processedData?.filter(
        (contract: any) =>
          contract.name?.toLowerCase().includes(searchLower) ||
          contract.file_number?.toLowerCase().includes(searchLower) ||
          contract.dossier_number?.toLowerCase().includes(searchLower)
      );
    }

    // Apply contract type filter
    if (filters?.selectedContractTypes && filters.selectedContractTypes.length > 0) {
      processedData = processedData?.filter((contract: any) =>
        filters.selectedContractTypes.includes(contract.contract_type)
      );
    }

    // Apply award procedure filter
    if (filters?.selectedAwardProcedures && filters.selectedAwardProcedures.length > 0) {
      processedData = processedData?.filter((contract: any) =>
        filters.selectedAwardProcedures.includes(contract.award_procedure)
      );
    }

    return { data: processedData, error: null };
  } catch (error: any) {
    console.error("Error in getContracts:", error);
    return { data: null, error: error.message };
  }
};

export const getContractById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        *,
        contract_areas(
          area:areas(id, name)
        ),
        contract_centers(
          center:centers(id, name)
        ),
        lots(
          *,
          credits(
            *,
            invoices(
              *,
              centers(name)
            )
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    // Transform data to match Contract interface
    const transformedData = {
      ...data,
      areas: data.contract_areas?.map((ca: any) => ca.area?.name) || [],
      centers: data.contract_centers?.map((cc: any) => cc.center?.name) || [],
      centers_data: data.contract_centers?.map((cc: any) => cc.center) || [],
      lots: data.lots?.map((lot: any) => ({
        ...lot,
        credit_real_total: lot.credits?.reduce(
          (sum: number, credit: any) => sum + ((Number(credit.credit_committed_d) || 0) + (Number(credit.modificacio_credit) || 0) - (Number(credit.credit_recognized_o) || 0)),
          0
        ),
        credits: lot.credits?.map((credit: any) => ({
          ...credit,
          invoices: credit.invoices?.map((invoice: any) => ({
            ...invoice,
            centers: invoice.centers // Keep as object/array as returned by Supabase, type definition handles it
          }))
        }))
      }))
    };

    return { data: transformedData, error: null };
  } catch (error: any) {
    console.error("Error in getContractById:", error);
    return { data: null, error: error.message };
  }
};

export const createContract = async (contractData: any) => {
  try {
    const { areas, centers, ...contract } = contractData;

    // Insert contract
    const { data: newContract, error: contractError } = await supabase
      .from("contracts")
      .insert(contract)
      .select()
      .single();

    if (contractError) throw contractError;

    // Insert area associations
    if (areas && areas.length > 0) {
      const areaAssociations = areas.map((areaId: string) => ({
        contract_id: newContract.id,
        area_id: areaId,
      }));

      const { error: areasError } = await supabase
        .from("contract_areas")
        .insert(areaAssociations);

      if (areasError) throw areasError;
    }

    // Insert center associations
    if (centers && centers.length > 0) {
      const centerAssociations = centers.map((centerId: string) => ({
        contract_id: newContract.id,
        center_id: centerId,
      }));

      const { error: centersError } = await supabase
        .from("contract_centers")
        .insert(centerAssociations);

      if (centersError) throw centersError;
    }

    return { data: newContract, error: null };
  } catch (error: any) {
    console.error("Error in createContract:", error);
    return { data: null, error: error };
  }
};

export const deleteContract = async (id: string) => {
  try {
    const { error } = await supabase.from("contracts").delete().eq("id", id);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error("Error in deleteContract:", error);
    return { error: error.message };
  }
};
