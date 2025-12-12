import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export const usePlayerData = (userId) => {
    // Note: userId n'est plus utilisé dans l'URL car le token suffit, 
    // mais on le garde pour la clé de cache ("enabled").

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['playerData', userId], // Clé unique pour le cache
        
        // 👇 C'est ici que ça change : on appelle la nouvelle route
        queryFn: () => api.get('/game/player/me'),
        
        // On ne lance la requête que si on est connecté
        enabled: !!userId, 
        
        // Options de confort
        staleTime: 1000 * 60, // Considère les données "fraîches" pendant 1 minute
        refetchOnWindowFocus: true // Rafraîchit quand on revient sur l'onglet
    });

    return { data, isLoading, error, refetch };
};