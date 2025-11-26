import { supabase } from "@/integrations/supabase/client";

export interface ContractFilters {
  search: string;
  selectedAreas: string[];
  selectedCenters: string[];
  selectedContractTypes: string[];
  selectedAwardProcedures: string[];
  selectedYears: number[];
}

export const getContracts = async (filters?: ContractFilters, page = 0, pageSize = 50) => {
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
          start_date,
          end_date,
          credits(
            credit_real,
            credit_committed_d,
            credit_recognized_o,
            modificacio,
            prorroga,
            any
          ),
          cpv_codes(
            code,
            description_ca
          )
        )
      `, { count: 'exact' });

    // Apply search filter (DB side)
    if (filters?.search) {
      const searchTerm = filters.search;
      // Using ilike for case-insensitive search on multiple columns
      query = query.or(`name.ilike.%${searchTerm}%,dossier_number.ilike.%${searchTerm}%,file_number.ilike.%${searchTerm}%`);
    }

    // Apply area filter
    if (filters?.selectedAreas && filters.selectedAreas.length > 0) {
      query = query.in("contract_areas.area_id", filters.selectedAreas);
    }

    // Apply center filter
    if (filters?.selectedCenters && filters.selectedCenters.length > 0) {
      query = query.in("contract_centers.center_id", filters.selectedCenters);
    }

    // Apply contract type filter (DB side)
    if (filters?.selectedContractTypes && filters.selectedContractTypes.length > 0) {
      query = query.in("contract_type", filters.selectedContractTypes);
    }

    // Apply award procedure filter (DB side)
    if (filters?.selectedAwardProcedures && filters.selectedAwardProcedures.length > 0) {
      query = query.in("award_procedure", filters.selectedAwardProcedures);
    }

    // Pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order("created_at", { ascending: false });

    const { data, count, error } = await query;

    if (error) throw error;

    // Calculate lot totals
    let processedData = data?.map((contract: any) => ({
      ...contract,
      lots: contract.lots?.map((lot: any) => ({
        ...lot,
        credit_real_total: lot.credits?.reduce(
          (sum: number, credit: any) => sum + ((Number(credit.credit_committed_d) || 0) - (Number(credit.credit_recognized_o) || 0)),
          0
        ),
        cpv_code: lot.cpv_codes?.code,
        cpv_description: lot.cpv_codes?.description_ca,
      })),
    }));

    // Apply year filter (Client side - complex logic remains here for now)
    // Note: This filters AFTER pagination, which is not ideal but necessary without complex DB logic
    if (filters?.selectedYears && filters.selectedYears.length > 0) {
      const years = filters.selectedYears;

      const isPeriodInYears = (start?: string, end?: string) => {
        if (!start && !end) return false;
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;
        const startYear = startDate ? startDate.getFullYear() : null;
        const endYear = endDate ? endDate.getFullYear() : null;

        if (!startYear && !endYear) return false;

        return years.some(year => {
          if (startYear && startYear > year) return false;
          if (endYear && endYear < year) return false;
          return true;
        });
      };

      processedData = processedData?.filter((contract: any) => {
        // Filter Lots
        contract.lots = contract.lots?.filter((lot: any) => {
          // Filter Credits
          lot.credits = lot.credits?.filter((credit: any) => {
            // Filter Invoices
            if (credit.invoices) {
              credit.invoices = credit.invoices.filter((invoice: any) => {
                const invoiceYear = new Date(invoice.invoice_date).getFullYear();
                return years.includes(invoiceYear);
              });
            }

            const creditYear = Number(credit.any);
            const creditValid = years.includes(creditYear);
            return creditValid || (credit.invoices && credit.invoices.length > 0);
          });

          // Recalculate lot total after filtering credits
          if (lot.credits) {
            lot.credit_real_total = lot.credits.reduce(
              (sum: number, credit: any) => sum + ((Number(credit.credit_committed_d) || 0) - (Number(credit.credit_recognized_o) || 0)),
              0
            );
          } else {
            lot.credit_real_total = 0;
          }

          const lotValid = isPeriodInYears(lot.start_date, lot.end_date);
          return lotValid || (lot.credits && lot.credits.length > 0);
        });

        const contractValid = isPeriodInYears(contract.start_date, contract.end_date);
        return contractValid || (contract.lots && contract.lots.length > 0);
      });
    }

    return { data: processedData, count, error: null };
  } catch (error: any) {
    console.error("Error in getContracts:", error);
    return { data: null, count: 0, error: error.message };
  }
};

export const getContractById = async (id: string, filters?: ContractFilters) => {
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
          ),
          cpv_codes(
            code,
            description_ca
          )
        )
      `)
      .eq("id", id)
      .order("sort_order", { foreignTable: "lots", ascending: true })
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
          (sum: number, credit: any) => sum + ((Number(credit.credit_committed_d) || 0) - (Number(credit.credit_recognized_o) || 0)),
          0
        ),
        credits: lot.credits?.map((credit: any) => ({
          ...credit,
          invoices: credit.invoices?.map((invoice: any) => ({
            ...invoice,
            centers: invoice.centers // Keep as object/array as returned by Supabase, type definition handles it
          }))
        })),
        cpv_code: lot.cpv_codes?.code,
        cpv_description: lot.cpv_codes?.description_ca,
      }))
    };

    // Apply year filter to detail view
    if (filters?.selectedYears && filters.selectedYears.length > 0) {
      const years = filters.selectedYears;

      const isPeriodInYears = (start?: string, end?: string) => {
        if (!start && !end) return false;
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;
        const startYear = startDate ? startDate.getFullYear() : null;
        const endYear = endDate ? endDate.getFullYear() : null;

        if (!startYear && !endYear) return false;

        return years.some(year => {
          if (startYear && startYear > year) return false;
          if (endYear && endYear < year) return false;
          return true;
        });
      };

      // Filter Lots
      transformedData.lots = transformedData.lots?.filter((lot: any) => {
        // Filter Credits
        lot.credits = lot.credits?.filter((credit: any) => {
          // Filter Invoices
          if (credit.invoices) {
            credit.invoices = credit.invoices.filter((invoice: any) => {
              const invoiceYear = new Date(invoice.invoice_date).getFullYear();
              return years.includes(invoiceYear);
            });
          }

          const creditYear = Number(credit.any);
          const creditValid = years.includes(creditYear);
          return creditValid || (credit.invoices && credit.invoices.length > 0);
        });

        // Recalculate lot total after filtering credits
        if (lot.credits) {
          lot.credit_real_total = lot.credits.reduce(
            (sum: number, credit: any) => sum + ((Number(credit.credit_committed_d) || 0) - (Number(credit.credit_recognized_o) || 0)),
            0
          );
        } else {
          lot.credit_real_total = 0;
        }

        const lotValid = isPeriodInYears(lot.start_date, lot.end_date);
        return lotValid || (lot.credits && lot.credits.length > 0);
      });
    }

    return { data: transformedData, error: null };
  } catch (error: any) {
    console.error("Error in getContractById:", error);
    return { data: null, error: error.message };
  }
};

export const createContract = async (contractData: any) => {
  try {
    const { areas, centers, lots, ...contract } = contractData;

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

    // Insert lots
    if (contractData.lots && contractData.lots.length > 0) {
      const lotsToInsert = contractData.lots.map((lot: any, index: number) => {
        // Intentar extraer código CPV si existe en la descripción
        // Formato esperado: 45100000-5 o 45100000
        const cpvMatch = lot.cpv_description?.match(/^(\d{8}(-\d)?)/);
        const cpvCode = cpvMatch ? cpvMatch[0] : null;

        return {
          contract_id: newContract.id,
          name: lot.name,
          // Si tenemos un código CPV potencial, podríamos intentar usarlo, 
          // pero si no existe en la tabla cpv_codes fallará por FK.
          // Por seguridad, guardamos la descripción en observaciones si no es un código exacto conocido,
          // o podríamos dejarlo null y que el usuario lo rellene.
          // Para este caso, vamos a guardar la descripción completa en observations
          // y dejar cpv null para evitar errores de FK, a menos que estemos seguros.
          // Estrategia segura: cpv null, observations = cpv_description
          cpv: null,
          awardee: lot.supplier_name,
          cif_nif: lot.supplier_cif,
          start_date: lot.start_date || null,
          end_date: lot.end_date || null,
          formalization_date: lot.formalization_date || null,
          sort_order: index,
          observations: lot.cpv_description ? `CPV: ${lot.cpv_description}` : null
        };
      });

      const { error: lotsError } = await supabase
        .from("lots")
        .insert(lotsToInsert);

      if (lotsError) throw lotsError;
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

export const updateLotOrder = async (lots: { id: string; sort_order: number; contract_id: string; name: string }[]) => {
  try {
    const updates = lots.map(({ id, sort_order, contract_id, name }) => ({
      id,
      sort_order,
      contract_id,
      name,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("lots")
      .upsert(updates as any, { onConflict: "id" });

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error("Error in updateLotOrder:", error);
    return { error: error.message };
  }
};
