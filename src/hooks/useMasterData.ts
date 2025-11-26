import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAreas() {
    return useQuery({
        queryKey: ["areas"],
        queryFn: async () => {
            const { data, error } = await supabase.from("areas").select("*").order("name");
            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useCenters() {
    return useQuery({
        queryKey: ["centers"],
        queryFn: async () => {
            const { data, error } = await supabase.from("centers").select("*").order("name");
            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
