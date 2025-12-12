import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { supabase } from '../lib/supabaseClient';

export const useTravel = (session, notify, setRewardModal, joueur, setExpeditionChrono, setLevelUpData) => { // 👈 Ajout setLevelUpData
    const queryClient = useQueryClient();

    // 1. CHARGEMENT DONNÉES
    const { data: travelData } = useQuery({
        queryKey: ['travelData'],
        queryFn: () => api.get('/game/travel/data'),
        staleTime: Infinity,
    });

    const destinations = travelData?.destinations || [];
    const naviresRefs = travelData?.naviresRef || [];

    // 2. CALCULS LOCAUX (Automatiques)
    let navireRef = null;
    if (joueur && naviresRefs.length > 0) {
        const nextLevel = (joueur.niveau_navire || 1) + 1;
        const nextShip = naviresRefs.find(r => r.niveau === nextLevel);
        if (nextShip) {
            let materiauxComplets = [];
            if (nextShip.materiaux) {
                const matIds = Object.keys(nextShip.materiaux);
                materiauxComplets = matIds.map(id => ({ id: parseInt(id), qte_requise: nextShip.materiaux[id] }));
            }
            navireRef = { ...nextShip, listeMateriaux: materiauxComplets };
        }
    }

    // 3. ACTIONS

    // --- DÉPART ---
    const travelMutation = useMutation({
        mutationFn: (destId) => api.post('/game/travel/start', { userId: session.user.id, destinationId: destId }),
        onSuccess: (res) => { 
            notify(res.message, "success"); 
            
            // A. On lance le chrono visuel IMMÉDIATEMENT
            if (res.fin) {
                const diff = new Date(res.fin).getTime() - Date.now();
                setExpeditionChrono(diff > 0 ? diff : 0);

                // B. OPTIMISTIC UPDATE
                queryClient.setQueryData(['playerData', session.user.id], (old) => ({
                    ...old,
                    expedition_fin: res.fin
                }));
            }
        },
        onError: (err) => notify(err.message, "error")
    });

    // --- RÉCOLTE ---
    const collectMutation = useMutation({
        mutationFn: () => api.post('/game/expedition/collect', { userId: session.user.id }),
        
        onSuccess: (data) => {
            const rewards = data.rewards || {}; 

            // 1. MISE À JOUR DE LA MODALE DE RÉCOMPENSE
            setRewardModal({ 
                type: "EXPÉDITION", 
                title: "Retour de Voyage!", 
                message: data.message, 
                xp: rewards.xp || 0,
                berrys: rewards.berrys || 0,
                items: rewards.items || [],
                success: true 
            });
            
            setExpeditionChrono(null);
            
            // 2. MISE À JOUR OPTIMISTE DU JOUEUR (XP, Berrys, Level)
            queryClient.setQueryData(['playerData', session.user.id], (old) => {
                if (!old) return old;
                
                // Si Level Up, le back renvoie le nouveau niveau
                const newLevel = data.newLevel || old.niveau;
                const newXp = (old.xp || 0) + (rewards.xp || 0); // Note: sera corrigé au refresh si level up
                
                return {
                    ...old,
                    expedition_fin: null,
                    berrys: (old.berrys || 0) + (rewards.berrys || 0),
                    xp: newXp,
                    niveau: newLevel 
                };
            });

            // 3. 🔥 DÉTECTION DU LEVEL UP 🔥
            if (data.leveledUp && setLevelUpData) {
                setTimeout(() => {
                    setLevelUpData({ level: data.newLevel });
                }, 800); // Petit délai pour laisser le temps de lire le message de retour
            }

            // Rafraîchissement global
            queryClient.invalidateQueries(['playerData']);
            queryClient.invalidateQueries(['leaderboard']);
        },
        onError: (err) => notify(err.message, "error")
    });

    const ameliorerNavire = async () => {
        const { data, error } = await supabase.rpc('ameliorer_navire'); 
        if(data?.success) { 
            notify(data.message, "success"); 
            queryClient.invalidateQueries(['playerData']); 
        } else {
            notify(data?.message || error?.message, "error");
        }
    };

    return {
        destinations,
        navireRef,
        voyager: (dest) => travelMutation.mutate(dest.id),
        recolterExpedition: () => collectMutation.mutate(), 
        ameliorerNavire,
        chargerChantier: () => {} 
    };
};