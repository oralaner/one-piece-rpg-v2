import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export const usePlayerData = (userId) => {
    
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['playerData', userId],
        
        queryFn: async () => {
            try {
                const res = await api.get('/game/player/me');
                return res.data;
            } catch (err) {
                // On laisse l'erreur remonter pour que React Query la gère
                throw err;
            }
        },
        
        enabled: !!userId,
        
        // 👇 C'EST ICI QUE TOUT SE JOUE
        retry: (failureCount, error) => {
            // Si c'est une 404, ON ARRÊTE TOUT DE SUITE (Pas de retry)
            if (error?.response?.status === 404) {
                console.log("🛑 404 Détectée -> Arrêt des tentatives");
                return false;
            }
            // Sinon on réessaie un peu
            return failureCount < 2;
        },

        staleTime: 1000 * 60,
        refetchOnWindowFocus: true
    });

    // 👇 DÉTECTION DU NOUVEAU JOUEUR
    // On vérifie si l'erreur est bien une 404 (Not Found)
    const isNewPlayer = error?.response?.status === 404;

    if (isNewPlayer) {
        console.log("🆕 C'est un nouveau joueur ! Flag isNewPlayer = true");
    }

    return { 
        data, 
        isLoading, // Si il y a une erreur, isLoading passe à false
        error, 
        refetch,
        isNewPlayer // ✅ On exporte cette info capitale
    };
};