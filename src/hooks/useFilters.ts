import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Area, Center, ContractFilters } from "@/types";

export function useFilters() {
    const [search, setSearch] = useState("");
    const [areas, setAreas] = useState<Area[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
    const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>([]);
    const [selectedAwardProcedures, setSelectedAwardProcedures] = useState<string[]>([]);

    const fetchAreas = useCallback(async () => {
        const { data, error } = await supabase
            .from("areas")
            .select("*")
            .order("name");

        if (data && !error) {
            setAreas(data);
        }
    }, []);

    const fetchCenters = useCallback(async () => {
        const { data, error } = await supabase
            .from("centers")
            .select("*")
            .order("name");

        if (data && !error) {
            setCenters(data);
        }
    }, []);

    useEffect(() => {
        fetchAreas();
        fetchCenters();
    }, [fetchAreas, fetchCenters]);

    const handleAreaToggle = useCallback((areaId: string) => {
        setSelectedAreas((prev) =>
            prev.includes(areaId)
                ? prev.filter((id) => id !== areaId)
                : [...prev, areaId]
        );
    }, []);

    const handleCenterToggle = useCallback((centerId: string) => {
        setSelectedCenters((prev) =>
            prev.includes(centerId)
                ? prev.filter((id) => id !== centerId)
                : [...prev, centerId]
        );
    }, []);

    const handleContractTypeToggle = useCallback((type: string) => {
        setSelectedContractTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    }, []);

    const handleAwardProcedureToggle = useCallback((procedure: string) => {
        setSelectedAwardProcedures((prev) =>
            prev.includes(procedure)
                ? prev.filter((p) => p !== procedure)
                : [...prev, procedure]
        );
    }, []);

    const clearFilters = useCallback(() => {
        setSearch("");
        setSelectedAreas([]);
        setSelectedCenters([]);
        setSelectedContractTypes([]);
        setSelectedAwardProcedures([]);
    }, []);

    const filters: ContractFilters = {
        search,
        selectedAreas,
        selectedCenters,
        selectedContractTypes,
        selectedAwardProcedures,
    };

    return {
        filters,
        areas,
        centers,
        setSearch,
        handleAreaToggle,
        handleCenterToggle,
        handleContractTypeToggle,
        handleAwardProcedureToggle,
        clearFilters,
    };
}
