import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export const usePlayerData = (userId) => {
    
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['playerData', userId],
        
        queryFn: async () => {
            console.log("🔄 Fetching player data for:", userId);
            try {
                const res = await api.get('/game/player/me');
                console.log("✅ Data received:", res.data?.pseudo);
                return res.data;
            } catch (err) {
                console.error("❌ Error fetching player:", err.response?.status);
                throw err;
            }
        },
        
        enabled: !!userId,
        retry: 1, // On essaie 1 fois en cas d'échec réseau, mais pas en boucle
        staleTime: 0, // Toujours frais
        refetchOnWindowFocus: true
    });

    return { 
        data, 
        isLoading, 
        error, 
        refetch
    };
};