import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export const usePlayerData = (userId) => {
    
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['playerData', userId],
        
        queryFn: async () => {
            const t = new Date().getTime();
            console.log(`📡 Appel API /player/me (t=${t})...`);
            
            // On récupère la réponse brute d'axios/api
            const res = await api.get(`/game/player/me?t=${t}`);
            
            // 👇 CORRECTION : On vérifie où sont les données
            // Si res contient directement l'ID, c'est que c'est le joueur
            // Sinon, c'est peut-être dans res.data
            const playerData = res.id ? res : res.data;

            console.log("✅ Données extraites:", playerData);
            
            if (!playerData || !playerData.id) {
                console.error("❌ ERREUR: Données invalides reçues !");
                return null;
            }

            return playerData;
        },
        
        enabled: !!userId,
        retry: false, 
        staleTime: 0,
        refetchOnWindowFocus: true
    });

    return { data, isLoading, error, refetch };
};