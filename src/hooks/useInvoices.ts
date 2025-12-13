import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { Invoice } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useInvoices() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    const createInvoice = useCallback(async (invoiceData: Partial<Invoice>) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("invoices")
                .insert(invoiceData as TablesInsert<'invoices'>)
                .select()
                .single();

            if (error) throw error;
            toast({
                title: "Èxit",
                description: "Factura creada correctament",
            });
            return data;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            toast({
                title: "Error",
                description: "No s'ha pogut crear la factura",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const updateInvoice = useCallback(async (id: string, invoiceData: Partial<Invoice>) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("invoices")
                .update(invoiceData)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            toast({
                title: "Èxit",
                description: "Factura actualitzada correctament",
            });
            return data;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            toast({
                title: "Error",
                description: "No s'ha pogut actualitzar la factura",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const deleteInvoice = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.from("invoices").delete().eq("id", id);
            if (error) throw error;
            toast({
                title: "Èxit",
                description: "Factura eliminada correctament",
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            toast({
                title: "Error",
                description: "No s'ha pogut eliminar la factura",
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
        createInvoice,
        updateInvoice,
        deleteInvoice,
    };
}
