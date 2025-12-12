import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api'; 

// 👇 AJOUT DE 'joueur' dans les arguments
export const usePlayerActions = (session, notify, setRewardModal, refreshPlayer, setLevelUpData, joueur) => {
    const queryClient = useQueryClient();
    const [tempsRestant, setTempsRestant] = useState(0);

    // --- 0. CALCUL DU TEMPS RESTANT AU CHARGEMENT ---
    useEffect(() => {
        if (joueur?.derniere_fouille) {
            const now = new Date().getTime();
            const last = new Date(joueur.derniere_fouille).getTime();
            const diff = now - last;
            const COOLDOWN = 3600000; // 1 Heure

            if (diff < COOLDOWN) {
                setTempsRestant(COOLDOWN - diff);
            } else {
                setTempsRestant(0);
            }
        }
    }, [joueur]); // Se relance si le joueur est mis à jour

    // --- 1. INVESTIR STATS ---
    const investMutation = useMutation({
        mutationFn: (stat) => api.post('/game/invest', { userId: session.user.id, stat: stat.toLowerCase() }),
        onSuccess: (res) => {
            notify(res.message, "success");
            if (refreshPlayer) refreshPlayer();
            queryClient.invalidateQueries(['playerData']);
        },
        onError: (err) => notify(err.message, "error")
    });

    // --- 2. FAIRE UNE ACTIVITÉ ---
    const activityMutation = useMutation({
        mutationFn: () => api.post('/game/activity/click', { userId: session.user.id }),
        onSuccess: (data) => {
            const rewards = data.rewards || {};
            notify(data.message, "success");
            
            setRewardModal({ 
                type: "ACTIVITÉ", 
                title: "Activité terminée !", 
                message: data.message, 
                xp: rewards.xp || 0, 
                berrys: rewards.berrys || 0, 
                items: rewards.items || [], 
                success: true 
            });

            if (data.leveledUp && setLevelUpData) {
                setTimeout(() => setLevelUpData({ level: data.newLevel }), 1500); 
            }
            
            // 👇 MODIFICATION ICI : On lance le chrono de 1h (3 600 000 ms)
            setTempsRestant(3600000); 
            
            if (refreshPlayer) refreshPlayer();
            queryClient.invalidateQueries(['playerData']);
        },
        onError: (err) => notify(err.message, "error")
    });

    // Timer visuel
    useEffect(() => {
        if (tempsRestant <= 0) return;
        const interval = setInterval(() => {
            setTempsRestant((prev) => {
                if (prev <= 1000) return 0;
                return prev - 1000;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [tempsRestant]);

    return {
        investirStat: (stat) => investMutation.mutate(stat),
        clickActivite: () => {
            if (tempsRestant > 0 || activityMutation.isPending) return;
            activityMutation.mutate();
        },
        tempsRestant,
        explorationLoading: activityMutation.isPending
    };
};