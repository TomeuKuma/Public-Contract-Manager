import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Contract } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getContracts, createContract as createContractService, deleteContract as deleteContractService } from "@/lib/contractService";

export function useContracts() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    const fetchContracts = useCallback(async (filters?: any) => {
        setLoading(true);
        try {
            const { data, error } = await getContracts(filters);
            if (error) throw new Error(error);
            setContracts(data || []);
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
    }, [toast]);

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
        fetchContracts,
        createContract,
        deleteContract,
    };
}
