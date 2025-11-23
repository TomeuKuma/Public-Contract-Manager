import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CPVCode, CPVSearchParams } from '@/types/cpv.types';

export const useCPVCodes = () => {
    const [searchParams, setSearchParams] = useState<CPVSearchParams>({});

    const { data: cpvCodes, isLoading, error } = useQuery({
        queryKey: ['cpvCodes', searchParams],
        queryFn: async () => {
            let query = supabase
                .from('cpv_codes')
                .select('*')
                .order('code_numeric', { ascending: true })
                .limit(searchParams.limit || 50);

            if (searchParams.query) {
                const isNumeric = /^\d/.test(searchParams.query);
                if (isNumeric) {
                    query = query.ilike('code_numeric', `${searchParams.query}%`);
                } else {
                    query = query.textSearch('search_vector', searchParams.query, {
                        type: 'websearch',
                        config: 'catalan'
                    });
                }
            }

            if (searchParams.depthLevel) {
                query = query.eq('depth_level', searchParams.depthLevel);
            }

            if (searchParams.parentCode) {
                // Logic to find children based on parent code structure
                // If parent is Division (XX000000), we want Groups (XXX00000) starting with XX
                // This logic can be complex in SQL, but for now let's assume we filter by prefix
                // and exact depth level + 1

                // Extract the significant part of the parent code
                const parentNumeric = searchParams.parentCode.split('-')[0];
                let prefix = '';
                let nextDepth = 0;

                if (parentNumeric.endsWith('000000')) { // Division (2 digits)
                    prefix = parentNumeric.substring(0, 2);
                    nextDepth = 2;
                } else if (parentNumeric.endsWith('00000')) { // Group (3 digits)
                    prefix = parentNumeric.substring(0, 3);
                    nextDepth = 3;
                } else if (parentNumeric.endsWith('0000')) { // Class (4 digits)
                    prefix = parentNumeric.substring(0, 4);
                    nextDepth = 4;
                } else if (parentNumeric.endsWith('000')) { // Category (5 digits)
                    prefix = parentNumeric.substring(0, 5);
                    nextDepth = 5;
                }

                if (prefix) {
                    query = query
                        .like('code_numeric', `${prefix}%`)
                        .eq('depth_level', nextDepth);
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching CPV codes:', error);
                throw error;
            }

            return data as CPVCode[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const getCPVById = async (id: string): Promise<CPVCode | null> => {
        const { data, error } = await supabase
            .from('cpv_codes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching CPV by ID:', error);
            return null;
        }
        return data as CPVCode;
    };

    return {
        cpvCodes,
        isLoading,
        error,
        searchParams,
        setSearchParams,
        getCPVById
    };
};
