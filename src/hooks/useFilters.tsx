import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Area, Center, ContractFilters } from "@/types";

interface FilterContextType {
    filters: ContractFilters;
    areas: Area[];
    centers: Center[];
    setSearch: (search: string) => void;
    handleAreaToggle: (areaId: string) => void;
    handleCenterToggle: (centerId: string) => void;
    handleContractTypeToggle: (type: string) => void;
    handleAwardProcedureToggle: (procedure: string) => void;
    handleYearToggle: (year: number) => void;
    clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
    const [search, setSearch] = useState("");
    const [areas, setAreas] = useState<Area[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
    const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>([]);
    const [selectedAwardProcedures, setSelectedAwardProcedures] = useState<string[]>([]);
    const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);

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

    const handleYearToggle = useCallback((year: number) => {
        setSelectedYears((prev) =>
            prev.includes(year)
                ? prev.filter((y) => y !== year)
                : [...prev, year]
        );
    }, []);

    const clearFilters = useCallback(() => {
        setSearch("");
        setSelectedAreas([]);
        setSelectedCenters([]);
        setSelectedContractTypes([]);
        setSelectedAwardProcedures([]);
        setSelectedYears([]);
    }, []);

    const filters: ContractFilters = useMemo(() => ({
        search,
        selectedAreas,
        selectedCenters,
        selectedContractTypes,
        selectedAwardProcedures,
        selectedYears,
    }), [search, selectedAreas, selectedCenters, selectedContractTypes, selectedAwardProcedures, selectedYears]);

    const value = useMemo(() => ({
        filters,
        areas,
        centers,
        setSearch,
        handleAreaToggle,
        handleCenterToggle,
        handleContractTypeToggle,
        handleAwardProcedureToggle,
        handleYearToggle,
        clearFilters,
    }), [
        filters,
        areas,
        centers,
        setSearch,
        handleAreaToggle,
        handleCenterToggle,
        handleContractTypeToggle,
        handleAwardProcedureToggle,
        handleYearToggle,
        clearFilters
    ]);

    return <FilterContext.Provider value={value}> {children} </FilterContext.Provider>;
};

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error("useFilters must be used within a FilterProvider");
    }
    return context;
};
