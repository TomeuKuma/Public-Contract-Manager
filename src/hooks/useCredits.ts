import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { Credit } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useCredits() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    const createCredit = useCallback(async (creditData: Partial<Credit>) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("credits")
                .insert(creditData as TablesInsert<'credits'>)
                .select()
                .single();

            if (error) throw error;
            toast({
                title: "Èxit",
                description: "Crèdit creat correctament",
            });
            return data;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            toast({
                title: "Error",
                description: "No s'ha pogut crear el crèdit",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const updateCredit = useCallback(async (id: string, creditData: Partial<Credit>) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("credits")
                .update(creditData)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            toast({
                title: "Èxit",
                description: "Crèdit actualitzat correctament",
            });
            return data;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            toast({
                title: "Error",
                description: "No s'ha pogut actualitzar el crèdit",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const deleteCredit = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.from("credits").delete().eq("id", id);
            if (error) throw error;
            toast({
                title: "Èxit",
                description: "Crèdit eliminat correctament",
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            toast({
                title: "Error",
                description: "No s'ha pogut eliminar el crèdit",
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
        createCredit,
        updateCredit,
        deleteCredit,
    };
}
