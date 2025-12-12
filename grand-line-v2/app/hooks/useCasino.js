import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export const useCasino = (session, notify) => {
    const queryClient = useQueryClient();

    // États locaux pour l'interface (animations, streak Quitte ou Double)
    const [casinoState, setCasinoState] = useState({ enCours: false, gainActuel: 0, miseInitiale: 0, streak: 0 });
    const [cooldowns, setCooldowns] = useState({ DES: 0, PFC: 0, QUITTE: 0 });

    // Charger les cooldowns du localStorage au montage
    useEffect(() => {
        const saved = localStorage.getItem('casino_cooldowns');
        if (saved) { try { setCooldowns(JSON.parse(saved)); } catch (e) { console.error(e); } }
    }, []);

    // Helper pour sauvegarder le cooldown
    const updateCooldown = (jeu, timeMs) => {
        setCooldowns(prev => { 
            const n = { ...prev, [jeu]: Date.now() + timeMs }; 
            localStorage.setItem('casino_cooldowns', JSON.stringify(n)); 
            return n; 
        });
    };

    // --- MUTATION (ACTION DE JEU) ---
    const playMutation = useMutation({
        mutationFn: ({ jeu, mise, choix }) => api.post('/game/casino/play', { 
            userId: session.user.id, 
            jeu, 
            mise: parseInt(mise), 
            choix 
        }),
        onSuccess: (data, variables) => {
            const { jeu, mise } = variables;

            // 1. Logique spécifique "Quitte ou Double"
            if (jeu === 'QUITTE') {
                if (data.gain_final) { 
                    // Encaissé
                    setCasinoState({ enCours: false, gainActuel: 0, miseInitiale: 0, streak: 0 }); 
                    updateCooldown('QUITTE', 300000); // 5 min
                    notify(data.message, "success"); 
                } 
                else if (data.nouveau_gain) { 
                    // Continue (Gagné une étape)
                    setCasinoState(prev => ({ 
                        enCours: true, 
                        gainActuel: data.nouveau_gain, 
                        miseInitiale: parseInt(mise), 
                        streak: (prev.streak || 0) + 1 
                    })); 
                    notify(data.message, "success"); 
                } 
                else { 
                    // Perdu
                    setCasinoState({ enCours: false, gainActuel: 0, miseInitiale: 0, streak: 0 }); 
                    updateCooldown('QUITTE', 300000); 
                    notify(data.message, "error"); 
                }
            } 
            // 2. Logique Jeux Simples (Dés, PFC)
            else {
                const isWin = data.success || data.gain > 0;
                notify(isWin ? data.message : "Perdu...", isWin ? "success" : "error");
                updateCooldown(jeu, 300000); // 5 min
            }
            
            // 3. IMPORTANT : On met à jour l'argent du joueur partout
            queryClient.invalidateQueries(['playerData']);
        },
        onError: (err) => {
            notify(err.message || "Erreur technique", "error");
        }
    });

   const jouerCasino = async (jeu, mise, choix) => { // 👈 async
        const now = Date.now();
        if (cooldowns[jeu] > now) { 
            notify(`Attendez encore un peu pour le ${jeu}...`, "error"); 
            return null; 
        }
        
        try {
            // 👇 UTILISEZ mutateAsync ET RETOURNEZ LE RÉSULTAT
            const result = await playMutation.mutateAsync({ jeu, mise, choix });
            return result;
        } catch (error) {
            return null;
        }
    };

    return { casinoState, cooldowns, jouerCasino };
};