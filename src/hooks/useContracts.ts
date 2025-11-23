import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Contract } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getContracts, createContract as createContractService, deleteContract as deleteContractService } from "@/lib/contractService";

export function useContracts() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const { toast } = useToast();

    const fetchContracts = useCallback(async (filters?: any, newPage?: number) => {
        setLoading(true);
        const currentPage = newPage !== undefined ? newPage : page;
        try {
            const { data, count, error } = await getContracts(filters, currentPage, pageSize);
            if (error) throw new Error(error);

            if (newPage !== undefined) {
                setPage(newPage);
                // If new page (and not 0), maybe append? For now, replace.
                // To implement infinite scroll, we would append.
                // But let's stick to simple page replacement or append if desired.
                // For "Load More", we usually append.
                // Let's assume replacement for standard pagination, or let the component handle appending.
                // Actually, let's just return the data and let the component decide?
                // No, the hook manages state.
                // Let's replace 'contracts' for now.
                setContracts(data || []);
            } else {
                setContracts(data || []);
            }
            setTotalCount(count || 0);
        } catch (err: any) {
            setError(err);
            toast({
                title: "Error",
                description: "No s'han pogut carregar els contractes",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast, page, pageSize]);

    const loadMore = useCallback(async (filters?: any) => {
        const nextPage = page + 1;
        setLoading(true);
        try {
            const { data, count, error } = await getContracts(filters, nextPage, pageSize);
            if (error) throw new Error(error);

            setContracts(prev => [...prev, ...(data || [])]);
            setPage(nextPage);
            setTotalCount(count || 0);
        } catch (err: any) {
            setError(err);
            toast({
                title: "Error",
                description: "No s'han pogut carregar més contractes",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, toast]);

    const createContract = useCallback(async (contractData: any) => {
        setLoading(true);
        try {
            const { data, error } = await createContractService(contractData);
            if (error) throw error;
            toast({
                title: "Èxit",
                description: "Contracte creat correctament",
            });
            return data;
        } catch (err: any) {
            setError(err);
            toast({
                title: "Error",
                description: "No s'ha pogut crear el contracte",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const deleteContract = useCallback(async (id: string) => {
        try {
            const { error } = await deleteContractService(id);
            if (error) throw new Error(error);
            setContracts((prev) => prev.filter((c) => c.id !== id));
            toast({
                title: "Èxit",
                description: "Contracte eliminat correctament",
            });
        } catch (err: any) {
            setError(err);
            toast({
                title: "Error",
                description: "No s'ha pogut eliminar el contracte",
                variant: "destructive",
            });
            throw err;
        }
    }, [toast]);

    return {
        contracts,
        loading,
        error,
        totalCount,
        page,
        fetchContracts,
        loadMore,
        createContract,
        deleteContract,
    };
}
