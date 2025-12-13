import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getContracts, createContract as createContractService, deleteContract as deleteContractService, ContractSort, ContractFilters } from "@/lib/contractService";
import { Contract } from "@/types";

export function useContracts(filters?: ContractFilters, sort?: ContractSort) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        status,
        refetch
    } = useInfiniteQuery({
        queryKey: ['contracts', filters, sort],
        queryFn: async ({ pageParam = 0, queryKey }) => {
            const currentFilters = queryKey[1] as ContractFilters | undefined;
            const currentSort = queryKey[2] as ContractSort | undefined;
            const { data, count, error } = await getContracts(currentFilters, pageParam, 50, currentSort);
            if (error) throw new Error(error);
            return { data, count, nextPage: (data && data.length === 50) ? pageParam + 1 : undefined };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: true // Always enabled, filters can be empty
    });

    const contracts = data?.pages.flatMap((page) => page.data || []) || [];
    const totalCount = data?.pages[0]?.count || 0;

    const createContractMutation = useMutation({
        mutationFn: createContractService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast({
                title: "Èxit",
                description: "Contracte creat correctament",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "No s'ha pogut crear el contracte",
                variant: "destructive",
            });
        }
    });

    const deleteContractMutation = useMutation({
        mutationFn: deleteContractService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast({
                title: "Èxit",
                description: "Contracte eliminat correctament",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "No s'ha pogut eliminar el contracte",
                variant: "destructive",
            });
        }
    });

    return {
        contracts,
        loading: isFetching,
        error,
        totalCount,
        fetchContracts: refetch, // Map fetchContracts to refetch for compatibility
        loadMore: () => fetchNextPage(),
        createContract: createContractMutation.mutateAsync,
        deleteContract: deleteContractMutation.mutateAsync,
    };
}
