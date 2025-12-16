import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { usePlayerData } from './usePlayerData';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

// Modules
import { useCrew } from './useCrew';
import { useCombat } from './useCombat';
import { useInventory } from './useInventory';
import { useCasino } from './useCasino';
import { useSkills } from './useSkills';
import { useSocial } from './useSocial';
import { usePlayerActions } from './usePlayerActions';
import { useAllItems } from './useAllItems';

export const useGameLogic = () => {
    const queryClient = useQueryClient(); 

    // --- 1. ÉTATS GLOBAUX ---
    const [session, setSession] = useState(null);
    const [notificationState, setNotificationState] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [rewardModal, setRewardModal] = useState(null);
    const [levelUpData, setLevelUpData] = useState(null);
    
    const { data: meteoData } = useQuery({
        queryKey: ['meteo'],
        queryFn: () => api.get('/game/meteo'),
        refetchInterval: 60000, 
        staleTime: 30000
    });

    // --- 2. AUTHENTIFICATION ---
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
        return () => subscription.unsubscribe();
    }, []);
    
    // --- 3. DONNÉES JOUEUR (React Query) ---
    const { 
        data: playerData, 
        isLoading: isLoadingData, 
        refetch: rafraichirDonnees,
        isNewPlayer // ✅ MODIFICATION 1 : On récupère le signal "Nouveau Joueur"
    } = usePlayerData(session?.user?.id);

    // Variables dérivées
    const joueur = playerData || null;
    // const equipement = ... (déplacé plus bas pour être sûr)
    const notificationTimerRef = useRef(null);
    // --- 4. UTILITAIRES ---
    const notify = (input, type = "info") => {
        // 1. Si un timer tournait déjà, on l'annule pour éviter les conflits
        if (notificationTimerRef.current) {
            clearTimeout(notificationTimerRef.current);
        }

        let message = "";
        let notificationType = type;
        let data = null;

        if (typeof input === 'string') {
            message = input;
        } else if (input && typeof input.message === 'string') {
            message = input.message;
            notificationType = input.type || type;
            data = input; 
        } else {
            message = "Action terminée.";
        }

        // 2. On affiche la notif
        setNotificationState({ 
            message, 
            type: notificationType, 
            data 
        });
        
        // 3. On lance le nouveau timer de 2 secondes (2000ms)
        notificationTimerRef.current = setTimeout(() => {
            setNotificationState(null);
            notificationTimerRef.current = null;
        }, 2000); // 👈 C'est ici qu'on règle la durée
    };

    // =========================================================
    //                    MODULES LOGIQUES (HOOKS)
    // =========================================================

    // A. ÉQUIPAGE 🏴‍☠️
    const {
        monEquipage, membresEquipage, banqueLogs, candidatures, listeEquipages,
        kickTarget, setKickTarget, showRaidModal, setShowRaidModal,
        crewAction, confirmerExclusion, chargerDonneesEquipage
    } = useCrew(session, notify);

    // B. COMBAT ⚔️
    const {
        combatSession, combatLog, combatRewards, 
        areneJoueurs, areneFilter, setAreneFilter, chargerArene, 
        lancerCombat, jouerTour, fuirCombat, opponent, monPerso, quitterEcranFin,
        setCombatSession 
    } = useCombat(session, notify, rafraichirDonnees, setActiveTab, setLevelUpData);

    // C. INVENTAIRE & ÉCONOMIE 💰
    const {
        boutiqueItems, recettes, marcheItems,
        utiliserObjet, equiperObjet, desequiperObjet, acheterObjet, crafterItem, 
        acheterDuMarche, vendreObjet, sellModalItem, annulerVente, confirmerVente, 
        ouvrirModaleVente, marketSellItem, marketPrice, setMarketPrice, 
        annulerMiseEnVente, confirmerMiseEnVente,
        chargerBoutique, chargerRecettes, chargerMarche
    } = useInventory(session, notify, setRewardModal, rafraichirDonnees);

    // D. CASINO 🎲
    const { 
        casinoState, cooldowns, jouerCasino 
    } = useCasino(session, notify);

    // E. COMPÉTENCES 🔥
    const {
        competences, mesCompetences,
        acheterCompetence, equiperCompetence, eveillerHaki,
        chargerMesCompetences
    } = useSkills(session, notify, joueur);


    // G. SOCIAL 🗣️
    const {
        messages, chatChannel, setChatChannel, envoyerMessage,
        topJoueurs, topEquipages, leaderboardType, setLeaderboardType,
        mesTitres, showTitresModal, setShowTitresModal, changerTitre, chargerTitres, changerLeaderboard
    } = useSocial(session, notify, null, joueur, activeTab);

    // H. ACTIONS JOUEUR ⚡
    const {
        investirStat, clickActivite, tempsRestant, explorationLoading
    } = usePlayerActions(
        session, 
        notify, 
        setRewardModal, 
        rafraichirDonnees,
        setLevelUpData,
        joueur
    );

    // I. CATALOGUE GLOBAL D'OBJETS 📚
    const {
        allItemDefinitions
    } = useAllItems(session?.user?.id);

    // =========================================================
    //              CHARGEMENT LAZY DES ONGLETS
    // =========================================================
    useEffect(() => {
        if (!session) return;
        if (activeTab === 'boutique') chargerBoutique();
        if (activeTab === 'atelier') chargerRecettes();
        if (activeTab === 'marche') chargerMarche();
        if (activeTab === 'deck') chargerMesCompetences();
        if (activeTab === 'equipage') chargerDonneesEquipage();
        if (activeTab === 'arene') chargerArene();
        if (activeTab === 'chantier') chargerChantier();
    }, [activeTab, session, chatChannel, leaderboardType]); 

    // =========================================================
    //                        RETURN
    // =========================================================
    return {
        session, 
        joueur, 
        loading: isLoadingData, 
        isNewPlayer, // ✅ MODIFICATION 2 : On renvoie l'info à l'interface !
        
        notification: notificationState, 
        activeTab, setActiveTab, 
        rewardModal, setRewardModal,
        statsTotales: playerData?.statsTotales, 
        equipement: playerData?.equipement, 
        inventaire: playerData?.inventaire || [], 
        levelUpData,
        setLevelUpData,
        setNotification: setNotificationState, // Alias pour compatibilité
        
        // Modules
        monEquipage, membresEquipage, banqueLogs, candidatures, listeEquipages, crewAction, 
        kickTarget, setKickTarget, confirmerExclusion, setShowRaidModal, showRaidModal,
        
        combatSession, combatLog, combatRewards, areneJoueurs, areneFilter, setAreneFilter, 
        lancerCombat, jouerTour, fuirCombat, opponent, monPerso, chargerArene, quitterEcranFin,
        
        boutiqueItems, recettes, marcheItems, utiliserObjet, equiperObjet, desequiperObjet, 
        acheterObjet, crafterItem, acheterDuMarche, vendreObjet, 
        sellModalItem, annulerVente, confirmerVente, ouvrirModaleVente, 
        marketSellItem, marketPrice, setMarketPrice, annulerMiseEnVente, confirmerMiseEnVente,
        
        casinoState, cooldowns, jouerCasino, allItemDefinitions,
        
        competences, mesCompetences, acheterCompetence, equiperCompetence, eveillerHaki,
        
        messages, chatChannel, setChatChannel, envoyerMessage, topJoueurs, topEquipages, 
        leaderboardType, setLeaderboardType, changerLeaderboard,
        mesTitres, showTitresModal, setShowTitresModal, changerTitre, chargerTitres,
        
        investirStat, tempsRestant, explorationLoading, clickActivite, fetchJoueur: rafraichirDonnees, meteoData,
        notify,
        
        lancerCombatHistoire,

        // Sécurité pour l'objet joueur s'il est null
        joueur: playerData ? {
            ...playerData,
            energie_actuelle: playerData.energie_actuelle,
            energie_max: playerData.energie_max || 10,
            last_energie_update: playerData.last_energie_update
        } : null,
    };
};