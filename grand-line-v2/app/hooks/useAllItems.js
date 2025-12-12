import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";

export const useAllItems = (userId) => {
    // Récupère la liste complète de tous les objets (le catalogue)
    const { data, isLoading, error } = useQuery({
        queryKey: ['allItems'],
        queryFn: async () => {
            // Assurez-vous que le Backend a cette route (POST-IT pour toi)
            const response = await api.get('/game/items/all');
            return response.items || []; 
        },
        staleTime: 1000 * 60 * 60 * 24, // 24h de cache, ce catalogue change rarement
        enabled: !!userId,
    });

    return {
        allItemDefinitions: data || [],
        isLoadingAllItems: isLoading,
        errorAllItems: error
    };
};