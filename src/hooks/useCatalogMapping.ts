import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para mapear texto extraído del PDF a IDs de catálogos de la base de datos
 */
export function useCatalogMapping() {
    // Cargar áreas
    const { data: areas } = useQuery({
        queryKey: ['areas'],
        queryFn: async () => {
            const { data } = await supabase.from('areas').select('id, name').order('name');
            return data || [];
        },
        staleTime: 1000 * 60 * 60, // 1 hora
    });

    // Cargar centros
    const { data: centers } = useQuery({
        queryKey: ['centers'],
        queryFn: async () => {
            const { data } = await supabase
                .from('centers')
                .select('id, name, area_id')
                .order('name');
            return data || [];
        },
        staleTime: 1000 * 60 * 60,
    });

    /**
     * Encuentra el ID más cercano por similitud de texto
     * @param searchText Texto a buscar
     * @param catalog Catálogo donde buscar
     * @returns ID del elemento más similar o null si no hay match
     */
    const findClosestMatch = (
        searchText: string,
        catalog: Array<{ id: string; name: string }> | undefined
    ): string | null => {
        if (!catalog || catalog.length === 0) return null;
        if (!searchText) return null;

        const normalized = searchText.toLowerCase().trim();

        // 1. Búsqueda exacta
        const exact = catalog.find(item =>
            item.name.toLowerCase() === normalized
        );
        if (exact) return exact.id;

        // 2. Búsqueda por inclusión (el texto del catálogo contiene el search)
        const includes = catalog.find(item =>
            item.name.toLowerCase().includes(normalized)
        );
        if (includes) return includes.id;

        // 3. Búsqueda inversa (el search contiene el texto del catálogo)
        const reverseIncludes = catalog.find(item =>
            normalized.includes(item.name.toLowerCase())
        );
        if (reverseIncludes) return reverseIncludes.id;

        // Si no hay match, retornar null (usuario deberá seleccionar manualmente)
        return null;
    };

    /**
     * Encuentra múltiples IDs a partir de un array de nombres
     */
    const findMultipleMatches = (
        searchTexts: string[],
        catalog: Array<{ id: string; name: string }> | undefined
    ): string[] => {
        if (!searchTexts || searchTexts.length === 0) return [];

        return searchTexts
            .map(text => findClosestMatch(text, catalog))
            .filter((id): id is string => id !== null);
    };

    return {
        areas,
        centers,
        findClosestMatch,
        findMultipleMatches,
        isLoading: !areas || !centers,
    };
}

export interface MappedContractData {
    contract: {
        expedient: string;
        internal_reference: string;
        title: string;
        contract_type: string;
        award_procedure: string;
        award_date: string;
        contact_responsible: string;
        area_ids: string[];
        center_ids: string[];
        is_extendable: boolean;
        is_modifiable: boolean;
    };
    lots: Array<{
        name: string;
        cpv_description: string;
        supplier_name: string;
        supplier_cif: string;
        formalization_date: string;
        start_date: string;
        end_date: string;
    }>;
}
