import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useSocket } from './useSocket'; // <--- Import

export const useCrew = (session, notify) => {
    const queryClient = useQueryClient();
    
    // États purement UI (Modales)
    const [kickTarget, setKickTarget] = useState(null);
    const [showRaidModal, setShowRaidModal] = useState(false);

    // --- 1. RÉCUPÉRATION DES DONNÉES (CACHE) ---
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['crew', session?.user?.id],
        queryFn: () => api.get(`/game/crew/${session.user.id}`),
        enabled: !!session?.user?.id,
        staleTime: Infinity, // On ne recharge plus automatiquement via le temps...
        // refetchInterval: 10000, <--- SUPPRIMÉ (On passe aux Sockets)
    });

    const monEquipage = data?.hasCrew ? data.equipage : null;
    const membresEquipage = data?.membres || [];
    const banqueLogs = data?.logs || [];
    const candidatures = data?.candidatures || [];
    const listeEquipages = data?.list || [];

    // --- 2. WEBSOCKETS (Temps Réel) ---
    // On récupère la socket et on écoute les mises à jour d'équipage
    const { socket } = useSocket(session, 'ALLIANCE', monEquipage?.id);

    useEffect(() => {
        if (!socket) return;

        // Quand le serveur dit "Quelque chose a changé dans l'équipe !"
        const handleUpdate = () => {
            console.log("🔔 Update Crew reçu ! Rechargement...");
            refetch(); // On recharge les données fraiches
        };

        socket.on('crewUpdate', handleUpdate);

        return () => {
            socket.off('crewUpdate', handleUpdate);
        };
    }, [socket, refetch]);


    // --- 3. MUTATIONS (ACTIONS) ---
    const handleMutation = async (promise, successMsg) => {
        try {
            const res = await promise;
            if (successMsg) notify(successMsg, "success");
            else if (res?.message) notify(res.message, "success");
            
            // On recharge tout de suite pour soi-même
            refetch(); 
            queryClient.invalidateQueries(['playerData']); 
            return res;
        } catch (e) {
            notify(e.message || "Erreur", "error");
        }
    };

    const crewAction = {
        creer: (nom) => handleMutation(api.post('/game/crew/create', { userId: session.user.id, nom })),
        
        quitter: () => {
            if (confirm("Quitter l'équipage ?")) {
                handleMutation(api.post('/game/crew/leave', { userId: session.user.id }));
            }
        },

        banque: (action, montant) => {
            const actionBackend = action.toUpperCase();
            if (actionBackend !== 'DEPOSER' && actionBackend !== 'RETIRER') return;
            handleMutation(api.post('/game/crew/bank', { 
                userId: session.user.id, montant: parseInt(montant), action: actionBackend 
            }));
        },

        rejoindre: (crewId) => handleMutation(api.post('/game/crew/join', { userId: session.user.id, crewId })),

        recruter: (demandeId, accept) => handleMutation(
            api.post('/game/crew/recruit', { userId: session.user.id, applicationId: demandeId, accept }),
            accept ? "Recruté !" : "Refusé"
        ),

        kick: (membreId, pseudo) => setKickTarget({ id: membreId, pseudo }),

        settings: (nom, desc) => handleMutation(
            api.post('/game/crew/update', { userId: session.user.id, nom, description: desc })
        ),

        raid: {
            ouvrir: () => setShowRaidModal(true),
            
            lancer: async (typeId) => {
                setShowRaidModal(false);
                // L'API va déclencher le socket 'crewUpdate' pour tous les membres
                handleMutation(api.post('/game/crew/raid/start', { userId: session.user.id, type: typeId }));
            },

            rejoindre: () => handleMutation(api.post('/game/crew/raid/join', { userId: session.user.id })),

            forcerDepart: () => handleMutation(api.post('/game/crew/raid/force', { userId: session.user.id })),

            check: async (crewId) => {
                try {
                    const data = await api.post('/game/crew/raid/check', { crewId });
                    
                    // Cas 1 : Fin de mission (Combat)
                    if (data && data.status === 'FINI') {
                        // ... (ton code existant pour la modale reward) ...
                        return data;
                    }

                    // 👇 CAS 2 : FIN DE RÉPARATION (NOUVEAU) 👇
                    if (data && data.status === 'REPARE') {
                        notify(data.message, "success");
                        refetch(); // Recharge les données pour enlever l'écran rouge
                        return data;
                    }

                } catch (e) { console.error(e); }
            }
        }
    };

    const confirmerExclusion = () => {
        if (!kickTarget) return;
        handleMutation(api.post('/game/crew/kick', { userId: session.user.id, targetId: kickTarget.id }));
        setKickTarget(null);
    };

    return {
        monEquipage, membresEquipage, banqueLogs, candidatures, listeEquipages,
        isLoading, kickTarget, setKickTarget, showRaidModal, setShowRaidModal,
        crewAction, confirmerExclusion, chargerDonneesEquipage: refetch
    };
};