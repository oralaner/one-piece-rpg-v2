import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export const usePlayerData = (userId) => {
    
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['playerData', userId],
        
        queryFn: async () => {
            try {
                // ⚡ ASTUCE ANTI-CACHE : On ajoute un timestamp inutile dans l'URL
                // Cela force le navigateur à ne jamais utiliser son cache disque
                const timestamp = new Date().getTime();
                const res = await api.get(`/game/player/me?t=${timestamp}`);
                
                // Petit log pour vérifier ce qu'on reçoit
                if (res.data) {
                    console.log("📥 Données reçues:", res.data.pseudo, "| Faction:", res.data.faction);
                }
                
                return res.data;
            } catch (err) {
                throw err;
            }
        },
        
        enabled: !!userId,
        
        // 👇 CONFIGURATION ZÉRO CACHE
        staleTime: 0, // Les données sont considérées comme périmées instantanément
        cacheTime: 0, // On ne garde rien en mémoire cache inutilement
        refetchOnWindowFocus: true, // On recharge dès qu'on revient sur la fenêtre
        refetchOnMount: true // On recharge dès que le composant s'affiche
    });

    return { 
        data, 
        isLoading, 
        error, 
        refetch
    };
};