import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useSocket } from './useSocket';

export const useCombat = (session, notify, rafraichirDonnees, setActiveTab, setLevelUpData) => {
    const queryClient = useQueryClient();
    const [combatLog, setCombatLog] = useState([]); 
    
    // 👇 MODIFICATION ICI : On force le PVP par défaut (au lieu de 'PVE')
    const [areneFilter, setAreneFilter] = useState('PVP');
    
    const [combatRewards, setCombatRewards] = useState(null);
    const [localSession, setLocalSession] = useState(null);

    const { socket } = useSocket(session); 

    // --- 1. CHARGEMENT ---
    const { data: combatData } = useQuery({
        queryKey: ['activeFight', session?.user?.id],
        queryFn: () => api.get(`/game/fight/current/${session.user.id}`),
        enabled: !!session?.user?.id,
        refetchOnWindowFocus: false,
    });

    // SYNCHRONISATION INITIALE & SOCKETS
    useEffect(() => {
        if (combatData) {
            if (combatData.combat) setLocalSession(combatData.combat);
            
            if (combatData.combat && !combatData.combat.est_termine) {
                setActiveTab('combat_actif');
            }

            if (combatData.combat && combatData.combat.log_combat) {
                setCombatLog(prev => {
                    if (prev.length > 0) return prev; 
                    try {
                        const dbLogs = typeof combatData.combat.log_combat === 'string' 
                            ? JSON.parse(combatData.combat.log_combat) 
                            : combatData.combat.log_combat;
                        return dbLogs || [];
                    } catch(e) { return []; }
                });
            }

            if (socket && combatData.combat) {
                socket.emit('joinCombat', { combatId: combatData.combat.id });
            }
        }
    }, [combatData, socket, setActiveTab]);

    const opponent = combatData?.opponent || null;
    const monPerso = combatData?.me || null;

    // --- QUITTER ---
    const quitterEcranFin = () => {
        setCombatRewards(null);
        setLocalSession(null);
        setCombatLog([]); 
        queryClient.setQueryData(['activeFight', session?.user?.id], null); 
        if (rafraichirDonnees) rafraichirDonnees();
        
        // 👇 CORRECTION ICI : null = Retour Dashboard (Home)
        setActiveTab(null); 
    };

    const handleCombatResult = (data) => {
        if (data.log_joueur) setCombatLog(prev => [...prev, data.log_joueur]);
        if (data.log_ia) {
            setTimeout(() => { setCombatLog(prev => [...prev, data.log_ia]); }, 600);
        }

        queryClient.setQueryData(['activeFight', session?.user?.id], (old) => {
            if (!old) return old;
            return {
                ...old,
                combat: {
                    ...old.combat,
                    pv_joueur_actuel: data.pv_moi,
                    pv_adversaire_actuel: data.pv_adv
                }
            };
        });

        setLocalSession(prev => prev ? ({ ...prev, pv_joueur_actuel: data.pv_moi, pv_adversaire_actuel: data.pv_adv }) : null);

        if (data.etat !== 'EN_COURS') {
            const rewards = {
                etat: data.etat,
                gain_xp: data.gain_xp || 0,
                gain_berrys: data.gain_berrys || 0,
                gain_elo: data.gain_elo || 0,
                pv_moi: data.pv_moi,
                newLevel: data.newLevel 
            };
            
            setTimeout(() => {
                setCombatRewards(rewards);
                setLocalSession(prev => prev ? ({ ...prev, est_termine: true }) : null);
                
                queryClient.invalidateQueries(['playerData']); 
                if (rafraichirDonnees) rafraichirDonnees();

                if (data.newLevel && monPerso && data.newLevel > monPerso.niveau) {
                    setTimeout(() => {
                        if (setLevelUpData) setLevelUpData({ level: data.newLevel }); 
                    }, 1500);
                }
            }, 1000);
        } 
    };

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => { handleCombatResult(data); };
        socket.on('combatUpdate', handleUpdate);
        return () => { socket.off('combatUpdate', handleUpdate); };
    }, [socket, queryClient]);

    const startFightMutation = useMutation({
        mutationFn: (targetId) => api.post('/game/fight/start', { userId: session.user.id, targetId }),
        onSuccess: (res) => {
            notify(res.message, "success");
            
            const newCombatData = {
                combat: {
                    id: res.combat_id,
                    pv_joueur_actuel: res.pv_moi,
                    pv_adversaire_actuel: res.pv_adv,
                    log_combat: [],
                    est_termine: false
                },
                me: {
                    pv_max: res.pv_moi_max, 
                    niveau: res.niveau_joueur || 1 
                },
                opponent: {
                    id: 'bot', 
                    pseudo: 'Adversaire',
                    avatar_url: null,
                    pv_max: res.pv_adv_max
                }
            };

            queryClient.setQueryData(['activeFight', session?.user?.id], newCombatData);
            setLocalSession(newCombatData.combat);
            setCombatLog(["Le combat commence !"]);
            setCombatRewards(null);
            setActiveTab('combat_actif');
            if(socket) socket.emit('joinCombat', { combatId: res.combat_id });

            if (res.newEnergy !== undefined) {
                queryClient.setQueryData(['playerData', session?.user?.id], (old) => {
                    if (!old) return old;
                    return { ...old, energie_actuelle: res.newEnergy };
                });
            }
            queryClient.invalidateQueries(['activeFight']);
        },
        onError: (err) => notify(err.message, "error")
    });

    const playTurnMutation = useMutation({
        mutationFn: (skillId) => api.post('/game/fight/turn', { userId: session.user.id, combatId: localSession?.id, skillId }),
        onSuccess: (data) => handleCombatResult(data),
        onError: (err) => notify(err.message, "error")
    });

    const fuirMutation = useMutation({
        mutationFn: (combatId) => api.post('/game/combat/flee', { userId: session.user.id, combatId }),
        onSuccess: (res) => {
            notify(res.message, "info");
            setLocalSession(null); 
            setCombatLog([]); 
            queryClient.setQueryData(['activeFight', session?.user?.id], null); 
            queryClient.invalidateQueries(['playerData']);
            setActiveTab('aventure'); 
        },
        onError: (err) => notify(err.message, "error")
    });

    const { data: rawAreneData } = useQuery({ 
        queryKey: ['arena', areneFilter], 
        queryFn: () => api.get(`/game/arena/${areneFilter}`), 
        staleTime: 5000 
    });

    return {
        combatSession: localSession,
        setCombatSession: setLocalSession,
        
        opponent, monPerso, combatLog, combatRewards,
        areneJoueurs: rawAreneData || [],
        areneFilter, setAreneFilter,
        chargerArene: () => queryClient.invalidateQueries(['arena']), 
        quitterEcranFin,
        lancerCombat: (adversaire) => startFightMutation.mutate(adversaire.id),
        
        jouerTour: (skillId) => {
             if (!localSession?.id) {
                 console.error("ID Combat manquant !");
                 return;
             }
             if(socket && socket.connected) {
                 socket.emit('combatAction', { userId: session.user.id, combatId: localSession.id, skillId });
             } else {
                 playTurnMutation.mutate(skillId);
             }
        },
        
        fuirCombat: () => { 
            if (localSession?.id) fuirMutation.mutate(localSession.id);
        }
    };
};