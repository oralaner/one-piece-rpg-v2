import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export const usePlayerData = (userId) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['playerData', userId],
        
        queryFn: async () => {
            // On fait la requête normalement
            const res = await api.get('/game/player/me');
            return res.data; // On retourne les données si tout va bien
        },
        
        enabled: !!userId,
        
        // 👇 CRUCIAL : On configure le comportement en cas d'erreur
        retry: (failureCount, error) => {
            // Si l'erreur est 404 (Joueur introuvable), on ne réessaie PAS.
            if (error?.response?.status === 404) return false;
            // Sinon (erreur 500, réseau...), on réessaie 3 fois max
            return failureCount < 3;
        },

        staleTime: 1000 * 60,
        refetchOnWindowFocus: true
    });

    // 👇 On crée un "drapeau" facile à utiliser pour le reste de l'app
    // Si l'erreur est 404, alors isNewPlayer devient VRAI
    const isNewPlayer = error?.response?.status === 404;

    return { 
        data, 
        isLoading, 
        error, 
        refetch,
        isNewPlayer // ✅ Nouvelle variable à utiliser dans ton interface !
    };
};