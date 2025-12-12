import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { api } from '../utils/api';
import { useSocket } from './useSocket';

export const useSocial = (session, notify, rafraichirDonnees, joueur, activeTab) => {
    const queryClient = useQueryClient();

    // États UI
    const [chatChannel, setChatChannel] = useState('GENERAL');
    const [leaderboardType, setLeaderboardType] = useState('NIVEAU');
    const [showTitresModal, setShowTitresModal] = useState(false);

    // --- 1. CLASSEMENT (CACHE & CHARGEMENT IMMÉDIAT) ---
    const { data: leaderboardData } = useQuery({
        queryKey: ['leaderboard', leaderboardType],
        queryFn: () => api.get(`/game/leaderboard/${leaderboardType}`),
        staleTime: 1000 * 60 * 2, 
        enabled: !!session?.user?.id, // <--- CHARGE DÈS QUE LA SESSION EST LÀ (Même sur l'onglet Accueil)
    });

    const topJoueurs = leaderboardType === 'EQUIPAGE' ? [] : (leaderboardData || []);
    const topEquipages = leaderboardType === 'EQUIPAGE' ? (leaderboardData || []) : [];

    // --- 2. TITRES (CACHE) ---
    const { data: titresData } = useQuery({
        queryKey: ['titres', session?.user?.id],
        queryFn: () => api.get(`/game/titles/${session.user.id}`),
        enabled: showTitresModal
    });
    const mesTitres = titresData?.mesTitres || [];

    // --- 3. TCHAT (SOCKET.IO) ---
    const canalID = chatChannel === 'GENERAL' ? 'GLOBAL' : chatChannel === 'FACTION' ? `FACTION_${joueur?.faction}` : `EQUIPAGE_${joueur?.equipage_id}`;
    const { socketMessages, sendMessageSocket } = useSocket(session, activeTab, joueur?.equipage_id);

    // A. Charger l'historique initial via API
    const { data: history } = useQuery({
        queryKey: ['chat', canalID],
        queryFn: () => api.get(`/game/chat/history/${encodeURIComponent(canalID)}`),
        enabled: activeTab === 'tchat' && !!canalID,
        refetchOnWindowFocus: false
    });

    // État local unifié
    const [messages, setMessages] = useState([]);
    useEffect(() => {
        const historyMsgs = history ? [...history].reverse() : [];
        const liveMsgs = socketMessages.filter(m => m.canal === canalID);
        setMessages([...historyMsgs, ...liveMsgs]);
    }, [history, socketMessages, canalID]);

    // B. Écouter les nouveaux messages (Realtime)
    useEffect(() => {
        if (activeTab !== 'tchat' || !canalID) return;
        // ... (Logique de l'abonnement Supabase Realtime) ...
        const channel = supabase.channel('tchat_room')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `canal=eq.${canalID}` }, 
            (payload) => {
                setMessages((current) => [...current, payload.new]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeTab, canalID]);

    // --- 4. ACTIONS ---
    const envoyerMessage = (txt) => {
        sendMessageSocket(txt, joueur.pseudo, canalID, joueur.faction);
    };

    const changerTitre = async (nomTitre) => {
        try {
            // On passe par le backend NestJS au lieu de Supabase RPC
            const res = await api.post('/game/titles/equip', { 
                userId: session.user.id, 
                titre: nomTitre 
            });

            if (res.success) {
                notify(res.message, "success");
                queryClient.invalidateQueries(['playerData']); // Met à jour le profil
                queryClient.invalidateQueries(['titres', session?.user?.id]); 
                setShowTitresModal(false);
            }
        } catch (error) {
            console.error("Erreur changement titre:", error);
            notify(error.message || "Impossible de changer le titre", "error");
        }
    };

    return {
        messages, chatChannel, setChatChannel, envoyerMessage,
        topJoueurs, topEquipages, leaderboardType, setLeaderboardType,
        mesTitres, showTitresModal, setShowTitresModal, changerTitre,
        
        // Utils (On expose le setter pour le useEffect de useGameLogic)
        changerLeaderboard: setLeaderboardType,
        chargerTitres: () => queryClient.invalidateQueries(['titres']),
    };
};