import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { Lot } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useLots() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    const createLot = useCallback(async (lotData: Partial<Lot>) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("lots")
                .insert(lotData as TablesInsert<'lots'>)
                .select()
                .single();

            if (error) throw error;
            toast({
                title: "Èxit",
                description: "Lot creat correctament",
            });
            return data;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            toast({
                title: "Error",
                description: "No s'ha pogut crear el lot",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const updateLot = useCallback(async (id: string, lotData: Partial<Lot>) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("lots")
                .update(lotData)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            toast({
                title: "Èxit",
                description: "Lot actualitzat correctament",
            });
            return data;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            toast({
                title: "Error",
                description: "No s'ha pogut actualitzar el lot",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const deleteLot = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.from("lots").delete().eq("id", id);
            if (error) throw error;
            toast({
                title: "Èxit",
                description: "Lot eliminat correctament",
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            toast({
                title: "Error",
                description: "No s'ha pogut eliminar el lot",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    return {
        loading,
        error,
        createLot,
        updateLot,
        deleteLot,
    };
}
