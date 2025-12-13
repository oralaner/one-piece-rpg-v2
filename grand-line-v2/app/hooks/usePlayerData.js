import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export const usePlayerData = (userId) => {
    
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['playerData', userId],
        
        queryFn: async () => {
            // Timestamp anti-cache
            const t = new Date().getTime();
            console.log(`📡 Appel API /player/me (t=${t})...`);
            
            const res = await api.get(`/game/player/me?t=${t}`);
            
            // 👇 LOG COMPLET DE LA RÉPONSE
            console.log("📦 Réponse BRUTE API:", res); 

            // Sécurité : parfois axios met les données dans res.data, parfois res.data.data
            const playerData = res.data;

            if (!playerData) {
                console.error("❌ ERREUR: Données vides reçues du backend !");
                return null;
            }

            console.log("✅ Données extraites:", playerData);
            return playerData;
        },
        
        enabled: !!userId,
        retry: false, // On ne réessaie pas pour éviter les boucles en dev
        staleTime: 0,
        refetchOnWindowFocus: true
    });

    return { data, isLoading, error, refetch };
};