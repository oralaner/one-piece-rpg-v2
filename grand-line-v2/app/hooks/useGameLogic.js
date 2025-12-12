import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { usePlayerData } from './usePlayerData';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Assurez-vous que useQueryClient est importé
import { api } from '../utils/api';

// Modules
import { useCrew } from './useCrew';
import { useCombat } from './useCombat';
import { useInventory } from './useInventory';
import { useCasino } from './useCasino';
import { useSkills } from './useSkills';
import { useTravel } from './useTravel';
import { useSocial } from './useSocial';
import { usePlayerActions } from './usePlayerActions';
import { useAllItems } from './useAllItems';

export const useGameLogic = () => {
    // ✅ CORRECTION : Déclaration indispensable
    const queryClient = useQueryClient(); 

    // --- 1. ÉTATS GLOBAUX ---
    const [session, setSession] = useState(null);
    const [notification, setNotification] = useState(null);
    const [notificationState, setNotificationState] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [rewardModal, setRewardModal] = useState(null);
    const [expeditionChrono, setExpeditionChrono] = useState(null);
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
        refetch: rafraichirDonnees 
    } = usePlayerData(session?.user?.id);

    // Variables dérivées
    const joueur = playerData || null;
    const equipement = playerData?.equipement || { arme: null, tete: null, corps: null, bottes: null, bague: null, collier: null, navire: null };
    const inventaire = playerData?.inventaire || [];
    const statsTotales = playerData?.statsTotales || null; 

    // --- 4. UTILITAIRES ---
    const notify = (input, type = "info") => {
    let message = "";
    let notificationType = type;
    let data = null; // Pour stocker les données spéciales (comme newTitleUnlocked)

    if (typeof input === 'string') {
        message = input;
    } else if (input && typeof input.message === 'string') {
        // C'est une réponse typique de mutation (ex: { success: true, message: "..." })
        message = input.message;
        notificationType = input.type || type;
        data = input; // On stocke l'objet complet
    } else {
        message = "Action terminée.";
    }

    // Mise à jour de l'état de notification avec toutes les infos
    setNotificationState({ 
        message, 
        type: notificationType, 
        data 
    });
    
    // Effacer après 4 secondes
    setTimeout(() => setNotificationState(null), 4000);
};
    // --- 5. MOTEUR DU CHRONO (Voyage) ---
    useEffect(() => {
        if (!joueur) return;
        
        const updateChrono = () => {
             if (joueur.expedition_fin) {
                const now = new Date().getTime();
                const fin = new Date(joueur.expedition_fin).getTime();
                const diff = fin - now;

                if (diff <= 0) {
                    setExpeditionChrono(0);
                } else {
                    setExpeditionChrono(diff);
                }
            } 
            else if (expeditionChrono !== null) {
                 setExpeditionChrono(null);
            }
        };

        updateChrono();
        const interval = setInterval(updateChrono, 1000);
        return () => clearInterval(interval);

    }, [joueur?.expedition_fin]); 

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

    // F. VOYAGE & NAVIRE 🧭
    const {
        destinations, navireRef,
        voyager, recolterExpedition, ameliorerNavire, chargerChantier
    } = useTravel(
        session, 
        notify, 
        setRewardModal, 
        joueur, 
        setExpeditionChrono,
        setLevelUpData
    );

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
        allItemDefinitions, isLoadingAllItems
    } = useAllItems(session?.user?.id);

    // --- FONCTION SPÉCIALE : COMBAT HISTOIRE ---
    const lancerCombatHistoire = async (targetName) => {
        try {
            const res = await api.post('/game/combat/start-story', { 
                userId: joueur.id, 
                targetName 
            });
            
            if (res.success) {
                setActiveTab('combat_actif');
                
                const combatData = await api.get(`/game/combat/current/${joueur.id}`);
                
                // ✅ Maintenant queryClient est défini !
                queryClient.setQueryData(['activeFight', session?.user?.id], combatData);

                if (setCombatSession) {
                    setCombatSession(combatData.combat); 
                } else {
                    console.error("setCombatSession introuvable");
                }
            }
        } catch (err) {
            notify(err.message || "Erreur lancement combat", 'error');
        }
    };

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
        session, joueur, loading: isLoadingData, notification, activeTab, setActiveTab, 
        rewardModal, setRewardModal,
        statsTotales, equipement, inventaire, levelUpData,
        setLevelUpData,
        setNotification, 
        
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
        
        destinations, navireRef, voyager, recolterExpedition, ameliorerNavire, expeditionChrono,
        
        messages, chatChannel, setChatChannel, envoyerMessage, topJoueurs, topEquipages, 
        leaderboardType, setLeaderboardType, changerLeaderboard,
        mesTitres, showTitresModal, setShowTitresModal, changerTitre, chargerTitres,
        
        investirStat, tempsRestant, explorationLoading, clickActivite, fetchJoueur: rafraichirDonnees, meteoData, notification: notificationState,
        notify,
        
        lancerCombatHistoire,

        joueur: playerData ? {
            ...playerData,
            energie_actuelle: playerData.energie_actuelle,
            energie_max: playerData.energie_max || 10,
            last_energie_update: playerData.last_energie_update
        } : null,

        equipement: playerData?.equipement,
        navireRef: playerData?.nextNavire, 
        inventaire: playerData?.inventaire || [],
    };
};