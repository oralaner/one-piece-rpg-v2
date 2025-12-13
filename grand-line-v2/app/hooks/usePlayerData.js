import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export const usePlayerData = (userId) => {
    
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['playerData', userId],
        
        queryFn: async () => {
            const res = await api.get('/game/player/me');
            return res.data;
        },
        
        enabled: !!userId,
        
        // Configuration simple par défaut
        staleTime: 1000 * 60,
        refetchOnWindowFocus: true
    });

    return { 
        data, 
        isLoading, 
        error, 
        refetch
        // ❌ Pas de isNewPlayer ici, ce n'est plus nécessaire
    };
};