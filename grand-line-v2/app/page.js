"use client";
import { useState, useEffect } from "react";
import { useGameLogic } from "./hooks/useGameLogic";
import { supabase } from "./lib/supabaseClient";
import { getRankInfo, getFactionTheme, formatTemps } from "./utils/gameUtils";
import TravelOverlay from "./components/TravelOverlay";
import RewardModal from "./components/RewardModal";
import LogoutButton from './components/LogoutButton';
import { useQueryClient } from '@tanstack/react-query';
import FactionSelector from './components/FactionSelector';
import LevelUpModal from './components/LevelUpModal';
import { api } from "./utils/api";

// Import Visuel
import EquipSlot from "./components/EquipSlot";

// Import Features
import InventoryTab from "./features/InventoryTab";
import HomeTab from "./features/HomeTab";
import ShopTab from "./features/ShopTab";
import CombatTab from "./features/CombatTab";
import CasinoTab from "./features/CasinoTab";
import MapTab from "./features/MapTab";
import TeamTab from "./features/TeamTab";
import ChatTab from "./features/ChatTab";
import ShipyardTab from "./features/ShipyardTab";
import CraftTab from "./features/CraftTab";
import MarketTab from "./features/MarketTab";
import LeaderboardTab from "./features/LeaderboardTab";
import HakiTab from "./features/HakiTab";
import DeckTab from "./features/DeckTab";
import StatsTab from "./features/StatsTab";
import ArenaTab from "./features/ArenaTab";
import StoryTab from './features/StoryTab';


export default function Home() {
    const queryClient = useQueryClient();
    const game = useGameLogic();
    
    // Déstructuration complète
    const { 
        joueur, statsTotales, activeTab, 
        inventaire, equipement,
        
        levelUpData, setLevelUpData, 
        isNewPlayer, // ✅ AJOUT CRUCIAL ICI

        // Actions Inventaire
        ouvrirModaleVente, confirmerVente, annulerVente, sellModalItem,
        marketSellItem, marketPrice, setMarketPrice, confirmerMiseEnVente, annulerMiseEnVente,
        // Actions Arène
        areneFilter, setAreneFilter, chargerArene,
        // Actions Raid
        showRaidModal, setShowRaidModal
    } = game;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [sellQuantity, setSellQuantity] = useState(1);

    useEffect(() => {
        if (sellModalItem || marketSellItem) {
            setSellQuantity(1);
        }
    }, [sellModalItem, marketSellItem]);

    // --- DONNÉES ---
    const currentTheme = getFactionTheme(joueur?.faction);
    const xpMax = joueur ? Math.floor(100 * Math.pow(joueur.niveau, 1.5)) : 100;
    const rankInfo = getRankInfo(joueur?.elo_pvp || 0);
    
    const vitaliteTotale = statsTotales?.vitalite || joueur?.vitalite || 0;
    const pvMaxCalcul = statsTotales?.pv_max_total || 100;
    
    // 🔒 FONCTION DE VERROUILLAGE
    const isTabLocked = (tabId) => {
        if (!joueur) return true;
        
        const chap = joueur.chapitre_actuel;
        const etape = joueur.etape_actuelle;
        const niv = joueur.niveau;

        const isBefore = (targetChap, targetStep) => {
            if (chap < targetChap) return true;
            if (chap === targetChap && etape < targetStep) return true;
            return false;
        };

        switch (tabId) {
            case 'aventure': 
            case 'tchat': 
            case 'classement': 
                return false;
            case 'stats':      return isBefore(1, 3);
            case 'inventaire': return isBefore(1, 5);
            case 'deck':       return isBefore(1, 7);
            case 'chantier': 
            case 'expeditions': 
                return chap < 2; 
            case 'boutique':   return isBefore(2, 3);
            case 'marche':     return isBefore(3, 3);
            case 'casino':     return isBefore(3, 4);
            case 'arene':      return isBefore(3, 5);
            case 'atelier':    return isBefore(4, 4);
            case 'equipage':   return niv < 10;
            case 'haki':       return niv < 50;
            default: return false;
        }
    };

    // --- BONUS SET ---
    const getActiveSetBonuses = () => {
        if (!equipement) return [];
        const counts = {};
        ['arme', 'tete', 'corps', 'bottes', 'bague', 'collier'].forEach(slot => {
            const item = equipement[slot];
            const setName = item?.nom_set || item?.objets?.nom_set; 
            if (setName) counts[setName] = (counts[setName] || 0) + 1;
        });
        const bonuses = [];
        const addBonus = (set, tier2, tier4) => {
            if (counts[set] >= 2) bonuses.push(tier2);
            if (counts[set] >= 4) bonuses.push(tier4);
        };
        addBonus('Marine', { name: "Discipline", desc: "+5% XP", color: "text-blue-400 border-blue-500/50" }, { name: "Justice", desc: "+15% XP", color: "text-cyan-300 border-cyan-500/50 bg-cyan-900/20" });
        addBonus('Pirate', { name: "Pillage", desc: "+5% Or", color: "text-yellow-400 border-yellow-500/50" }, { name: "Fortune", desc: "+15% Or", color: "text-amber-400 border-amber-500/50 bg-amber-900/20" });
        addBonus('Révolutionnaire', { name: "Vif", desc: "-5% CD", color: "text-red-400 border-red-500/50" }, { name: "Éclair", desc: "-15% CD", color: "text-rose-400 border-rose-500/50 bg-rose-900/20" });
        addBonus('Petit Herboriste', { name: "Apprenti", desc: "+10% Soin", color: "text-green-400 border-green-500/50" }, { name: "Maître", desc: "+25% Soin", color: "text-emerald-400 border-emerald-500/50 bg-emerald-900/20" });
        addBonus('Petit Forgeron', { name: "Main Ferme", desc: "+10% Perfect", color: "text-orange-400 border-orange-500/50" }, { name: "Maître Forge", desc: "+25% Perfect", color: "text-orange-300 border-orange-500/50 bg-orange-900/20" });
        addBonus('Aventurier', { name: "Débrouillard", desc: "+5% Stats", color: "text-slate-300 border-slate-500/50" }, { name: "Vétéran", desc: "+10% Stats", color: "text-white border-white/50 bg-white/10" });
        return bonuses;
    };
    const activeBonuses = getActiveSetBonuses();

    // --- LOGIN & LOADING ---
    if (!game.session) return (
        <main className="flex h-screen flex-col items-center justify-center bg-slate-950 font-sans p-4">
            <div className="z-10 text-center bg-slate-800/80 p-8 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-sm">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-6 font-pirata">GRAND LINE</h1>
                <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: window.location.origin } })} className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold py-3 px-6 rounded-xl shadow-lg transition transform active:scale-95">Connexion Discord</button>
            </div>
        </main>
    );

    // ✅ CAS 1 : JOUEUR INEXISTANT (Erreur 404 du Backend)
    // On affiche l'écran de création
    if (isNewPlayer) {
        return (
            <FactionSelector 
                userId={game.session.user.id} 
                onSelect={() => {
                    // Une fois créé, on invalide le cache pour recharger les données (qui ne seront plus 404)
                    queryClient.invalidateQueries(['playerData']);
                    // On peut aussi forcer un reload au cas où
                    setTimeout(() => window.location.reload(), 500);
                }} 
            />
        );
    }

    // CAS 2 : JOUEUR CHARGÉ MAIS DONNÉES INCOMPLÈTES (Backup)
    if (joueur && !joueur.faction) {
            return (
                <FactionSelector 
                    userId={joueur.id} 
                    onSelect={() => queryClient.invalidateQueries(['playerData'])} 
                />
            );
    }

    // CAS 3 : CHARGEMENT EN COURS
    if (!joueur) return <div className="flex h-screen items-center justify-center text-cyan-400 font-black animate-pulse">Chargement...</div>;
    
    // --- LISTE DES ONGLETS (Configuration) ---
    const tabs = [
        { id: 'aventure', icon: '📜', label: 'Aventure' },
        { id: 'classement', icon: '🏆', label: 'Top' },
        { id: 'stats', icon: '📊', label: 'Stats' },
        { id: 'inventaire', icon: '🎒', label: 'Sac' },
        { id: 'deck', icon: '📘', label: 'Skills' },
        { id: 'expeditions', icon: '🧭', label: 'Map' },
        { id: 'chantier', icon: '⛵', label: 'Navire' },   
        { id: 'boutique', icon: '🏪', label: 'Shop' },
        { id: 'marche', icon: '⚖️', label: 'HDV' },
        { id: 'casino', icon: '🎰', label: 'Casino' },
        { id: 'arene', icon: '⚔️', label: 'Arène' },
        { id: 'atelier', icon: '🔨', label: 'Craft' },
        { id: 'equipage', icon: '🤝', label: 'Alliance' },
        { id: 'haki', icon: '👁️', label: 'Haki' },
        { id: 'tchat', icon: '💬', label: 'Tchat' },
    ];

    const calculerChance = (typeRaid) => {
        if (!game.membresEquipage || game.membresEquipage.length === 0) return 0;
        const sommeNiveaux = game.membresEquipage.reduce((acc, membre) => acc + (membre.niveau || 1), 0);
        const nbMembres = game.membresEquipage.length;
        const bonusSynergie = 1 + (nbMembres * 0.05);
        const puissanceTotale = sommeNiveaux * bonusSynergie;
        const SEUILS = { 1: 15, 2: 60, 3: 150 };
        const seuil = SEUILS[typeRaid];
        let pourcentage = (puissanceTotale / seuil) * 100;
        if (pourcentage > 100) pourcentage = 100;
        if (pourcentage < 0) pourcentage = 0;
        return Math.floor(pourcentage);
    };
    
    const getColor = (pct) => {
        if (pct < 30) return "text-red-500";
        if (pct < 70) return "text-yellow-500";
        return "text-green-500";
    };

    // --- RENDER ---
    return (
        <main className={`h-screen w-screen ${currentTheme.appBg} font-sans relative overflow-hidden selection:bg-white/30 flex flex-col md:flex-row`}>
            {/* --- NOUVELLE ANIMATION DE VOYAGE --- */}
            {/* On affiche l'overlay SI le chrono tourne ET qu'on est pas en combat */}
            {(game.expeditionChrono !== null && game.expeditionChrono > 0 && activeTab !== 'combat_actif') && (
                <TravelOverlay 
                    timeLeft={game.expeditionChrono} 
                    theme={currentTheme} 
                />
            )}
            {/* Texture de fond */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none z-0"></div>

            {/* Notifications */}
                {game.notification && (() => {
                    const notification = game.notification;
                    const isNewTitle = notification.data && notification.data.newTitleUnlocked;
                    
                    let styleClass = '';
                    let icon = '';

                    if (isNewTitle) {
                        styleClass = 'bg-yellow-900/95 border-yellow-500 text-yellow-100 shadow-[0_0_20px_rgba(255,255,0,0.6)] animate-pulse-slow';
                        icon = '🏆';
                    } else if (notification.type === 'error') {
                        styleClass = 'bg-red-900/95 border-red-500 text-red-100';
                        icon = '⚠️';
                    } else {
                        styleClass = 'bg-emerald-900/95 border-emerald-500 text-emerald-100';
                        icon = '✅';
                    }

                    return (
                        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-xl shadow-2xl border backdrop-blur-md font-bold animate-bounce-in flex items-center gap-3 w-11/12 md:w-auto justify-center ${styleClass}`}>
                            <span>{icon}</span>
                            <span>{notification.message}</span>
                        </div>
                    );
                })()}              
            {/* === COLONNE GAUCHE : PROFIL === */}
            <div className={`md:w-[350px] md:h-full md:shrink-0 p-2 md:p-4 z-10 flex flex-col ${activeTab ? 'hidden md:flex' : 'flex h-full'}`}>
                <div className={`flex-1 overflow-y-auto custom-scrollbar rounded-3xl p-4 md:p-6 shadow-2xl relative border-2 ${currentTheme.panel} ${currentTheme.border}`}>
                    
                    {/* Header Profil */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative group shrink-0">
                            <div className={`rounded-full p-[3px] ${currentTheme.btnPrimary} shadow-lg shadow-black/50 transition-transform group-hover:scale-105 duration-300`}>
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-slate-900 border border-black/30 relative z-10">
                                    {joueur.avatar_url && <img src={joueur.avatar_url} className="w-full h-full object-cover"/>}
                                </div>
                            </div>
                            <div className={`absolute -bottom-1 -right-1 bg-slate-900 ${rankInfo.color} text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-600 shadow-md z-20`}>
                                {rankInfo.label}
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className={`text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md truncate font-pirata`}>{joueur.pseudo}</h2>
                            <button onClick={() => { game.chargerTitres(); game.setShowTitresModal(true); }} className="text-[10px] font-bold px-2 py-0.5 my-1 rounded border border-dashed border-slate-600 text-slate-400 hover:border-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all duration-300 group block w-full text-left truncate">
                                {joueur.titre_actuel ? <span className="text-yellow-500 italic">« {joueur.titre_actuel} »</span> : <span className="opacity-50 group-hover:opacity-100">+ Choisir un titre</span>}
                            </button>
                            <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest mt-1 ${joueur.faction === 'Pirate' ? 'text-red-500 drop-shadow-red' : 'text-cyan-400 drop-shadow-cyan'}`}>
                                Niv {joueur.niveau} • {joueur.faction}
                            </p>
                        </div>
                    </div>

                    {/* Barres Progression */}
                    <div className="space-y-2 mb-4 bg-black/20 p-2 rounded-xl border border-white/5">
                        
                        {/* SANTÉ */}
                        <div>
                            <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-0.5">
                                <span>SANTÉ</span>
                                <span className="text-white">{joueur.pv_actuel} / {pvMaxCalcul}</span>
                            </div>
                            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-slate-700/50">
                                <div 
                                    className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-500" 
                                    style={{ width: `${Math.min(100, (joueur.pv_actuel / pvMaxCalcul) * 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* EXPÉRIENCE */}
                        <div>
                            <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-0.5">
                                <span>EXPÉRIENCE</span>
                                <span className="text-cyan-400">
                                    {joueur.xp} / {xpMax} <span className="text-slate-500 text-[9px]">({Math.floor((joueur.xp / xpMax) * 100)}%)</span>
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-slate-700/50">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500" 
                                    style={{ width: `${Math.min(100, (joueur.xp / xpMax) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Mini Stats */}
                    <div className="grid grid-cols-3 gap-1 mb-4 bg-black/20 p-2 rounded-xl border border-white/5">
                        {[{i:'❤️',v:statsTotales?.vitalite},{i:'⚔️',v:statsTotales?.force},{i:'🧠',v:statsTotales?.intelligence},{i:'🍃',v:statsTotales?.agilite},{i:'🍀',v:statsTotales?.chance},{i:'🦉',v:statsTotales?.sagesse}].map((s,i) => (
                            <div key={i} className="text-center p-1 rounded hover:bg-white/5 cursor-default"><span className="text-[20px] block">{s.i}</span><span className={`text-[10px] font-bold ${currentTheme.textMain}`}>{s.v}</span></div>
                        ))}
                    </div>

                    {/* Bonus */}
                    <div className="mb-6">
                            <p className="text-[12px] font-bold uppercase text-slate-500 mb-1 tracking-widest">Bonus Actifs</p>
                            {activeBonuses.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {activeBonuses.map((bonus, i) => (
                                        <div key={i} className={`text-[10px] px-2 py-1 rounded border bg-black/40 flex items-center gap-1 ${bonus.color}`}>
                                            <span className="font-bold uppercase">{bonus.name}</span>
                                            <span className="opacity-70">({bonus.desc})</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (<p className="text-[9px] italic text-slate-600">Aucun bonus de panoplie.</p>)}
                        </div>
                    {/* Équipement (Grille compacte) */}
                        <div className="grid grid-cols-3 gap-1 mb-3 justify-items-center bg-black/20 p-1 rounded-xl border border-white/5"> 
                            <EquipSlot type="Tête" item={equipement.tete} onUnequip={game.desequiperObjet} theme={currentTheme} />
                            <EquipSlot type="Corps" item={equipement.corps} onUnequip={game.desequiperObjet} theme={currentTheme} />
                            <EquipSlot type="Arme" item={equipement.arme} onUnequip={game.desequiperObjet} theme={currentTheme} />
                            <EquipSlot type="Bottes" item={equipement.bottes} onUnequip={game.desequiperObjet} theme={currentTheme} />
                            <EquipSlot type="Bague" item={equipement.bague} onUnequip={game.desequiperObjet} theme={currentTheme} />
                            <EquipSlot type="Collier" item={equipement.collier} onUnequip={game.desequiperObjet} theme={currentTheme} />
                        </div>

                    <div className="text-center py-2 border-t border-slate-700/50 mb-2">
                        <span className="text-2xl font-black text-yellow-400 font-pirata">{joueur.berrys.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-yellow-600 ml-1">BERRYS</span>
                    </div>
                    
                    <button onClick={game.clickActivite} disabled={game.tempsRestant > 0 || game.explorationLoading} className={`w-full py-4 rounded-xl font-black text-lg shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 border border-white/20 relative overflow-hidden group ${(game.tempsRestant > 0 || game.explorationLoading) ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700' : currentTheme.btnPrimary }`}>
                        {game.tempsRestant > 0 ? <span className="font-mono text-xl tracking-widest">{formatTemps(game.tempsRestant)}</span> : game.explorationLoading ? <span className="animate-pulse text-sm">...</span> : <><span className="text-xl animate-bounce-slow">⚡</span> EXPLORER</>}
                    </button>
                    
                    {/* Espace vide pour le menu mobile en bas */}
                    <div className="h-20 md:hidden"></div>
                </div>
                <LogoutButton />
                {/* 🔥 BOUTON DEBUG POUR DEVELOPPEUR */}

            </div>

            {/* === DROITE : ZONE DE JEU (Pleine largeur sur Mobile quand actif) === */}
            <div className={`flex-1 flex flex-col h-full relative z-10 min-w-0 p-2 md:p-4 pl-0 ${!activeTab ? 'hidden md:flex' : 'flex'}`}>
                
                {/* Header PC (Navigation) */}
                <div className="hidden md:flex flex-wrap gap-3 mb-6 shrink-0">
                    {tabs.map(btn => {
                        // 🔒 Vérification si l'onglet est bloqué
                        const locked = isTabLocked(btn.id);

                        
                        return (
                            <button 
                                key={btn.id} 
                                onClick={() => !locked && game.setActiveTab(btn.id)} 
                                disabled={locked}
                                className={`w-20 h-20 lg:w-24 lg:h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-200 shadow-xl group relative overflow-hidden
                                ${locked 
                                    ? 'bg-slate-900 border-slate-800 cursor-not-allowed opacity-40 grayscale' // Style Gris pour bloqué
                                    : activeTab === btn.id 
                                        ? `${currentTheme.btnPrimary} border-white ring-2 ring-white/20 hover:scale-105 active:scale-95` 
                                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white hover:border-slate-500 hover:scale-105 active:scale-95'
                                }`}
                            >
                                {/* Contenu (Cadenas si bloqué, sinon Icône + Texte) */}
                                {locked ? (
                                    <span className="text-3xl opacity-30">🔒</span>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        <span className="text-2xl lg:text-3xl drop-shadow-md group-hover:-translate-y-1 transition-transform duration-300">{btn.icon}</span>
                                        <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">{btn.label}</span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Header Mobile (Retour) */}
                <button onClick={() => game.setActiveTab(null)} className="md:hidden mb-2 flex items-center gap-2 text-slate-400 font-bold uppercase text-xs px-2">
                    ⬅ Retour Profil
                </button>

                {/* ZONE DE CONTENU */}
                <div className={`flex-1 relative overflow-hidden rounded-3xl ${currentTheme.panel} shadow-2xl h-full`}>
                    
                    {/* --- BOUTON FERMER (CROIX) --- */}
                    {activeTab && (
                        <button 
                            onClick={() => game.setActiveTab(null)}
                            className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-red-600 text-white rounded-full flex items-center justify-center border border-white/20 hover:border-red-400 backdrop-blur-md transition-all duration-300 shadow-xl group"
                            title="Retour au Tableau de Bord"
                        >
                            <span className="text-xl font-bold group-hover:scale-110 transition-transform">✕</span>
                        </button>
                    )}

                    <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24 md:pb-8">
                        
                        {/* ACCUEIL (DASHBOARD) - Visible si aucun onglet */}
                        {!activeTab && (
                            <HomeTab 
                            joueur={joueur} 
                            statsTotales={statsTotales} 
                            expeditionChrono={game.expeditionChrono} 
                            topJoueurs={game.topJoueurs} 
                            topEquipages={game.topEquipages} 
                            onNavigate={game.setActiveTab} 
                            theme={currentTheme}
                            monEquipage={game.monEquipage} 
                            membresEquipage={game.membresEquipage}
                        />
                        )}
                        
                        {/* INJECTION DES FEATURES */}

                        {activeTab === 'aventure' && (
                        <StoryTab 
                            userId={joueur.id} 
                            notify={(msg, type) => game.setNotification({ message: msg, type })}
                            theme={currentTheme}
                            onStartFight={game.lancerCombatHistoire}
                            setLevelUpData={setLevelUpData} // 👈 LA CLÉ
                        />
                          )}
                          
                        {activeTab === 'inventaire' && (
                            <InventoryTab 
                                inventaire={inventaire}
                                joueur={joueur}                  
                                theme={currentTheme}             
                                onUse={game.utiliserObjet}       
                                onEquip={game.equiperObjet}      
                                onSell={game.vendreObjet}        
                                ouvrirModaleVente={ouvrirModaleVente} 
                            />
                        )}                       
                        {activeTab === 'boutique' && (
                            <ShopTab 
                                items={game.boutiqueItems} 
                                onBuy={game.acheterObjet} 
                                theme={currentTheme}
                                joueur={joueur}
                                inventaire={inventaire}
                            />
                        )}
                        {activeTab === 'casino' && (
                            <CasinoTab 
                                theme={currentTheme} 
                                berrys={joueur.berrys} 
                                onPlay={game.jouerCasino}
                                cooldowns={game.cooldowns || {}} 
                                casinoState={game.casinoState}    
                            />
                        )}            
                        {activeTab === 'combat_actif' && (game.combatSession || game.combatRewards) && (
                        <CombatTab 
                            session={game.session} 
                            joueur={joueur} 
                            combatSession={game.combatSession} 
                            opponent={game.opponent} 
                            monPerso={game.monPerso}
                            combatLog={game.combatLog} 
                            combatRewards={game.combatRewards} 
                            onAttack={game.jouerTour} 
                            onFlee={game.fuirCombat} 
                            onQuit={game.quitterEcranFin} 
                            theme={currentTheme} 
                            competences={game.competences} 
                        />
                    )}      
                        {activeTab === 'stats' && (
                            <StatsTab 
                                joueur={joueur} 
                                statsTotales={statsTotales} 
                                onInvest={game.investirStat} 
                                theme={currentTheme} 
                            />
                        )}                        
                        {activeTab === 'expeditions' && (
                            <MapTab 
                                destinations={game.destinations} 
                                joueur={joueur} 
                                expeditionChrono={game.expeditionChrono} 
                                onTravel={game.voyager} 
                                onCollect={game.recolterExpedition} 
                                theme={currentTheme}
                                meteoData={game.meteoData}
                                equipement={equipement}
                            />
                        )}                        
                        {activeTab === 'equipage' && (
                            <TeamTab 
                                myTeam={game.monEquipage}
                                members={game.membresEquipage}
                                allTeams={game.listeEquipages}
                                logs={game.banqueLogs}
                                candidatures={game.candidatures}
                                currentUser={joueur}
                                onAction={game.crewAction}
                                theme={currentTheme}
                            />
                        )}                        
                        {activeTab === 'tchat' && <ChatTab messages={game.messages} onSendMessage={game.envoyerMessage} channel={game.chatChannel} setChannel={game.setChatChannel} userFaction={joueur.faction} hasCrew={!!joueur.equipage_id} theme={currentTheme} userId={joueur.id} />}
                        {activeTab === 'chantier' && (
                        <ShipyardTab 
                            navire={equipement?.navire?.objets} 
                            nextNavire={game.navireRef}          
                            onUpgrade={game.ameliorerNavire} 
                            theme={currentTheme} 
                            berryCount={joueur.berrys} 
                            inventaire={game.inventaire} 
                        />
                    )}                  
                        {activeTab === 'atelier' && (
                            <CraftTab 
                                recettes={game.recettes} 
                                inventaire={game.inventaire}
                                onCraft={game.crafterItem}
                                theme={currentTheme}
                                itemDefinitions={game.allItemDefinitions}
                                niveauJoueur={joueur?.niveau || 1}
                            />
                        )}
                        {activeTab === 'marche' && <MarketTab items={game.marcheItems} onBuy={game.acheterDuMarche} theme={currentTheme} userId={joueur.id} />}
                        {activeTab === 'classement' && (
                            <LeaderboardTab 
                                players={game.topJoueurs} 
                                crews={game.topEquipages} 
                                theme={currentTheme} 
                                currentUser={joueur} 
                                setType={game.changerLeaderboard} 
                            />
                        )}
                        {activeTab === 'haki' && <HakiTab joueur={joueur} onTrain={game.eveillerHaki} theme={currentTheme} />}
                        {activeTab === 'deck' && <DeckTab joueur={joueur} allSkills={game.competences} mySkills={game.mesCompetences} equippedSkills={joueur.deck_combat} onEquip={game.equiperCompetence} onBuy={game.acheterCompetence} theme={currentTheme} />}
                        {activeTab === 'arene' && (
                        <ArenaTab 
                            adversaires={game.areneJoueurs} 
                            onFight={game.lancerCombat} 
                            onRefresh={game.chargerArene}
                            filter={game.areneFilter}
                            setFilter={game.setAreneFilter}
                            
                            energy={joueur?.energie_actuelle}
                            maxEnergy={joueur?.energie_max || 10}
                            lastUpdate={joueur?.last_energie_update}
                            
                            theme={currentTheme}
                        />
                    )}                  
                    </div>
                </div>
            </div>

            {/* === MENU MOBILE FLOTTANT (NEW !) === */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                <button 
                    onClick={() => setIsMobileMenuOpen(true)} 
                    className={`w-16 h-16 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8)] border-2 border-white/30 flex items-center justify-center text-3xl transition-transform active:scale-90 ${currentTheme.btnPrimary}`}
                >
                    ☰
                </button>
            </div>

            {/* OVERLAY DU MENU MOBILE */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/95 z-[60] animate-fadeIn p-6 flex flex-col justify-center backdrop-blur-xl">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-6 right-6 text-white text-4xl">✕</button>
                    
                    <h2 className="text-center text-2xl font-pirata text-white mb-8 tracking-widest">NAVIGATION</h2>
                    
                    {/* Contenu de la grille du menu mobile */}
                    <div className="grid grid-cols-3 gap-4">
                        {tabs.map(btn => {
                            // 🔒 Vérification
                            const locked = isTabLocked(btn.id);

                            return (
                                <button 
                                    key={btn.id} 
                                    onClick={() => { 
                                        if (!locked) {
                                            game.setActiveTab(btn.id); 
                                            setIsMobileMenuOpen(false);
                                        }
                                    }} 
                                    disabled={locked}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition 
                                    ${locked 
                                        ? 'bg-slate-900 border-slate-800 cursor-not-allowed opacity-40' 
                                        : activeTab === btn.id 
                                            ? 'border-yellow-500 bg-yellow-900/20 active:scale-95' 
                                            : 'bg-slate-800/50 border-slate-700 active:bg-slate-700 active:scale-95'
                                    }`}
                                >
                                    {locked ? (
                                        <span className="text-3xl mb-2 opacity-50">🔒</span>
                                    ) : (
                                        <>
                                            <span className="text-3xl mb-2">{btn.icon}</span>
                                            <span className="text-xs font-bold uppercase text-slate-300">{btn.label}</span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* OVERLAYS GLOBAUX */}

            {/* 🔥 MODALE LEVEL UP (Au dessus de tout) 🔥 */}
            {levelUpData && (
                <LevelUpModal 
                    newLevel={levelUpData.level} 
                    allRecipes={game.recettes || []} 
                    onClose={() => setLevelUpData(null)} 
                />
            )}  
            {game.rewardModal && (
                <RewardModal 
                    result={game.rewardModal} 
                    onClose={() => game.setRewardModal(null)} 
                />
            )}            
            {game.showTitresModal && (
                <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border relative overflow-hidden ${currentTheme.border} bg-slate-900`}>
                        <button onClick={() => game.setShowTitresModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white font-bold transition">✕</button>
                        <h2 className="text-xl font-black text-center mb-6 uppercase text-white tracking-widest font-pirata">Mes Titres <span className="text-yellow-500">({game.mesTitres.length})</span></h2>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            <button onClick={() => game.changerTitre(null)} className={`w-full text-left p-3 rounded-lg border border-slate-700 hover:bg-white/5 transition flex justify-between items-center ${!joueur.titre_actuel ? 'bg-white/10 border-white/30' : 'text-slate-500'}`}><span className="text-xs italic">Aucun titre</span></button>
                            {game.mesTitres.length === 0 ? (<p className="text-center text-slate-600 text-xs italic py-6">Vous n'avez pas encore débloqué de titres.</p>) : (game.mesTitres.map((t) => (<button key={t.id} onClick={() => game.changerTitre(t.titres_ref.nom)} className={`w-full text-left p-3 rounded-lg border transition flex justify-between items-center group ${joueur.titre_actuel === t.titres_ref.nom ? `bg-yellow-900/20 border-yellow-500/50` : `border-slate-800 hover:border-slate-600 hover:bg-slate-800`}`}><div><p className={`font-bold text-sm ${joueur.titre_actuel === t.titres_ref.nom ? 'text-yellow-400' : 'text-white'}`}>« {t.titres_ref.nom} »</p><p className="text-[10px] text-slate-500 mt-0.5">{t.titres_ref.description}</p></div>{joueur.titre_actuel === t.titres_ref.nom && <span className="text-yellow-400 text-xs">✔</span>}</button>)))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALE DE VENTE (Marchand NPC) --- */}
            {sellModalItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border-4 border-yellow-600 rounded-xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(234,179,8,0.2)] text-center relative overflow-hidden">
                        
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 pointer-events-none"></div>

                        <h3 className="text-2xl font-pirata text-yellow-500 mb-4 uppercase tracking-widest relative z-10">Marchand</h3>
                        
                        <div className="flex flex-col items-center gap-3 mb-4 relative z-10">
                            <div className="w-20 h-20 bg-slate-800 rounded-lg border-2 border-slate-600 flex items-center justify-center relative">
                                {sellModalItem.objets.image_url ? (
                                    <img src={sellModalItem.objets.image_url} alt={sellModalItem.objets.nom} className="w-16 h-16 object-contain" />
                                ) : (
                                    <span className="text-4xl">📦</span>
                                )}
                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white">
                                    x{sellModalItem.quantite}
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">{sellModalItem.objets.nom}</p>
                                <p className="text-slate-400 text-xs italic">Prix unitaire : {Math.floor(sellModalItem.objets.prix_achat / 2)} ฿</p>
                            </div>
                        </div>

                        {/* ✅ SÉLECTEUR DE QUANTITÉ NPC */}
                        <div className="relative z-10 bg-black/40 p-3 rounded-lg mb-4">
                            <p className="text-xs text-slate-400 mb-2 uppercase font-bold">Quantité à vendre</p>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <button onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))} className="w-8 h-8 bg-slate-700 rounded hover:bg-slate-600 font-bold">-</button>
                                <input 
                                    type="number" 
                                    value={sellQuantity} 
                                    onChange={(e) => setSellQuantity(Math.max(1, Math.min(Number(e.target.value), sellModalItem.quantite)))}
                                    className="w-16 text-center bg-slate-950 border border-slate-600 rounded py-1 text-white font-bold"
                                />
                                <button onClick={() => setSellQuantity(Math.min(sellModalItem.quantite, sellQuantity + 1))} className="w-8 h-8 bg-slate-700 rounded hover:bg-slate-600 font-bold">+</button>
                            </div>
                            <div className="flex justify-center gap-1 text-[10px]">
                                <button onClick={() => setSellQuantity(1)} className="px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 border border-slate-600">x1</button>
                                {sellModalItem.quantite >= 10 && <button onClick={() => setSellQuantity(10)} className="px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 border border-slate-600">x10</button>}
                                {sellModalItem.quantite >= 50 && <button onClick={() => setSellQuantity(50)} className="px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 border border-slate-600">x50</button>}
                                <button onClick={() => setSellQuantity(sellModalItem.quantite)} className="px-2 py-1 bg-yellow-900/50 text-yellow-200 rounded hover:bg-yellow-900/80 border border-yellow-700">MAX</button>
                            </div>
                        </div>

                        <p className="text-slate-300 mb-6 relative z-10">
                            Total : <span className="text-yellow-400 font-bold text-xl ml-1">{(Math.floor(sellModalItem.objets.prix_achat / 2) * sellQuantity).toLocaleString()} ฿</span>
                        </p>

                        <div className="flex gap-3 justify-center relative z-10">
                            <button onClick={annulerVente} className="px-6 py-2 rounded-lg bg-slate-700 text-slate-300 font-bold border border-slate-600 hover:bg-slate-600 transition">NON</button>
                            <button 
                                onClick={() => confirmerVente(sellModalItem, sellQuantity)} 
                                className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold border border-green-500 shadow-lg hover:bg-green-500 hover:scale-105 transition flex items-center gap-2"
                            >
                                <span>VENDRE</span> 💰
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALE MISE EN VENTE HDV --- */}
            {marketSellItem && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border-4 border-blue-500 rounded-xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(59,130,246,0.3)] text-center relative">
                        
                        <h3 className="text-2xl font-pirata text-blue-400 mb-2 uppercase tracking-widest">Hôtel des Ventes</h3>
                        
                        <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-lg border border-slate-700 mb-4 text-left">
                            <div className="w-12 h-12 bg-slate-900 rounded border border-white/10 flex items-center justify-center shrink-0 relative">
                                {marketSellItem.objets.image_url ? (
                                    <img src={marketSellItem.objets.image_url} alt="Icon" className="w-10 h-10 object-contain" />
                                ) : <span>📦</span>}
                                 <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                                    x{marketSellItem.quantite}
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">{marketSellItem.objets.nom}</p>
                                <p className="text-slate-400 text-[10px]">Fixez votre prix unitaire</p>
                            </div>
                        </div>

                        {/* ✅ SÉLECTEUR DE QUANTITÉ HDV */}
                        <div className="bg-black/20 p-3 rounded-lg border border-white/5 mb-4">
                            <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Quantité à vendre</label>
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))} className="w-6 h-6 bg-slate-700 rounded hover:bg-slate-600">-</button>
                                <input 
                                    type="number" 
                                    value={sellQuantity} 
                                    onChange={(e) => setSellQuantity(Math.max(1, Math.min(Number(e.target.value), marketSellItem.quantite)))}
                                    className="w-12 text-center bg-slate-950 border border-slate-600 rounded text-sm text-white font-bold"
                                />
                                <button onClick={() => setSellQuantity(Math.min(marketSellItem.quantite, sellQuantity + 1))} className="w-6 h-6 bg-slate-700 rounded hover:bg-slate-600">+</button>
                                <button onClick={() => setSellQuantity(marketSellItem.quantite)} className="text-[10px] bg-blue-900/50 text-blue-200 px-2 py-1 rounded border border-blue-800">MAX</button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-slate-400 text-xs uppercase font-bold mb-2">Prix Unitaire</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={marketPrice}
                                    onChange={(e) => setMarketPrice(e.target.value)}
                                    placeholder="Ex: 5000"
                                    className="w-full bg-slate-950 border-2 border-slate-600 rounded-xl py-3 px-4 text-center text-yellow-400 font-bold text-xl focus:border-blue-500 outline-none placeholder:text-slate-700"
                                    autoFocus
                                />
                                <span className="absolute right-4 top-3.5 text-yellow-600 font-pirata text-lg">฿</span>
                            </div>
                            {sellQuantity > 1 && marketPrice > 0 && (
                                <p className="text-xs text-slate-500 mt-2">Total estimé : <span className="text-yellow-500 font-bold">{(sellQuantity * marketPrice).toLocaleString()} ฿</span></p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button onClick={annulerMiseEnVente} className="px-6 py-2 rounded-lg bg-slate-700 text-slate-300 font-bold border border-slate-600 hover:bg-slate-600 transition">ANNULER</button>
                            <button 
                                onClick={() => confirmerMiseEnVente(marketSellItem, sellQuantity)} 
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold border border-blue-400 shadow-lg hover:bg-blue-500 hover:scale-105 transition flex items-center gap-2"
                            >
                                <span>METTRE EN VENTE</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALE EXCLUSION MEMBRE --- */}
            {game.kickTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border-4 border-red-600 rounded-xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.4)] text-center">
                        <h3 className="text-2xl font-pirata text-red-500 mb-4 uppercase tracking-widest">Le Tribunal Pirate</h3>
                        <p className="text-white text-lg mb-6">
                            Voulez-vous vraiment exclure <span className="font-bold text-red-400">{game.kickTarget.pseudo}</span> de l'équipage ?
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button 
                                onClick={() => game.setKickTarget(null)}
                                className="px-6 py-2 rounded-lg bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 transition"
                            >
                                ANNULER
                            </button>
                            <button 
                                onClick={game.confirmerExclusion}
                                className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold shadow-lg hover:bg-red-500 hover:scale-105 transition"
                            >
                                EXCLURE ☠️
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALE SÉLECTION RAID --- */}
            {game.showRaidModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fadeIn p-4 overflow-y-auto">
                    <div className="max-w-5xl w-full p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
                        <h2 className="text-4xl font-pirata text-center text-red-600 mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_red]">Salle de Guerre</h2>
                        <p className="text-center text-slate-400 mb-8 text-sm">
                            Le succès dépend du <span className="text-white font-bold">Niveau Cumulé</span> de votre escouade.<br/>
                            Plus vous êtes nombreux, plus vous avez de chances ! (+5% de puissance par membre)
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* === RAID 1 : PILLAGE === */}
                            <div onClick={() => game.crewAction.raid.lancer(1)} className="cursor-pointer group bg-slate-950 border-2 border-slate-800 hover:border-green-500 rounded-xl relative overflow-hidden transition-all hover:scale-105 flex flex-col">
                                <div className="h-32 bg-[url('https://i.pinimg.com/originals/1c/0d/18/1c0d181467406a489f66a2e4726dc131.jpg')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"></div>
                                <div className="p-5 flex-1 flex flex-col items-center text-center relative z-10">
                                    <h3 className="text-xl font-black text-green-400 uppercase mb-1">Pillage d'Île</h3>
                                    
                                    {/* Jauge de Chance (ID 1) */}
                                    <div className="bg-slate-900/80 p-2 rounded mb-3 border border-slate-700 w-full shadow-inner">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Succès ({game.membresEquipage?.length} mb)</span>
                                            <span className={`text-lg font-black ${getColor(calculerChance(1))}`}>{calculerChance(1)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${getColor(calculerChance(1)).replace('text', 'bg')}`} style={{width: `${calculerChance(1)}%`}}></div>
                                        </div>
                                    </div>

                                    <div className="text-[10px] bg-green-900/50 text-green-300 px-2 py-0.5 rounded mb-3">FACILE • Niv. Requis: ~15</div>
                                    <p className="text-xs text-slate-300 mb-4">Une attaque rapide sur une île marchande mal défendue.</p>
                                    
                                    <div className="mt-auto w-full space-y-2">
                                        <div className="flex justify-between text-xs bg-black/40 p-2 rounded">
                                            <span className="text-slate-400">Coût :</span><span className="text-yellow-400 font-bold">5,000 ฿</span>
                                        </div>
                                        <div className="flex justify-between text-xs bg-black/40 p-2 rounded">
                                            <span className="text-slate-400">Durée :</span><span className="text-white font-bold">1 Heure</span>
                                        </div>
                                        <div className="bg-indigo-900/30 border border-indigo-500/30 p-2 rounded mt-2">
                                            <p className="text-[10px] text-indigo-300 uppercase font-bold mb-1">Butin Potentiel</p>
                                            <div className="flex justify-center gap-3 font-bold text-sm">
                                                <span className="text-pink-400">500 XP</span><span className="text-yellow-400">50k ฿</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* === RAID 2 : BOSS === */}
                            <div onClick={() => game.crewAction.raid.lancer(2)} className="cursor-pointer group bg-slate-950 border-2 border-slate-800 hover:border-blue-500 rounded-xl relative overflow-hidden transition-all hover:scale-105 flex flex-col">
                                <div className="h-32 bg-[url('https://cdna.artstation.com/p/assets/images/images/007/689/818/large/loic-s-art-sea-king.jpg')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"></div>
                                <div className="p-5 flex-1 flex flex-col items-center text-center relative z-10">
                                    <h3 className="text-xl font-black text-blue-400 uppercase mb-1">Chasse au Boss</h3>

                                    {/* Jauge de Chance (ID 2) */}
                                    <div className="bg-slate-900/80 p-2 rounded mb-3 border border-slate-700 w-full shadow-inner">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Succès ({game.membresEquipage?.length} mb)</span>
                                            <span className={`text-lg font-black ${getColor(calculerChance(2))}`}>{calculerChance(2)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${getColor(calculerChance(2)).replace('text', 'bg')}`} style={{width: `${calculerChance(2)}%`}}></div>
                                        </div>
                                    </div>

                                    <div className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded mb-3">MOYEN • Niv. Requis: ~60</div>
                                    <p className="text-xs text-slate-300 mb-4">Traquer un Roi des Mers ou un Vice-Amiral isolé.</p>
                                    
                                    <div className="mt-auto w-full space-y-2">
                                        <div className="flex justify-between text-xs bg-black/40 p-2 rounded">
                                            <span className="text-slate-400">Coût :</span><span className="text-yellow-400 font-bold">15,000 ฿</span>
                                        </div>
                                        <div className="flex justify-between text-xs bg-black/40 p-2 rounded">
                                            <span className="text-slate-400">Durée :</span><span className="text-white font-bold">3 Heures</span>
                                        </div>
                                        <div className="bg-indigo-900/30 border border-indigo-500/30 p-2 rounded mt-2">
                                            <p className="text-[10px] text-indigo-300 uppercase font-bold mb-1">Butin Potentiel</p>
                                            <div className="flex justify-center gap-3 font-bold text-sm">
                                                <span className="text-pink-400">1k XP</span><span className="text-yellow-400">100k ฿</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* === RAID 3 : EPAVE === */}
                            <div onClick={() => game.crewAction.raid.lancer(3)} className="cursor-pointer group bg-slate-950 border-2 border-slate-800 hover:border-red-600 rounded-xl relative overflow-hidden transition-all hover:scale-105 flex flex-col">
                                <div className="h-32 bg-[url('https://i.pinimg.com/736x/2c/3a/02/2c3a02251ad06820299cb293b680c4c4.jpg')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"></div>
                                <div className="p-5 flex-1 flex flex-col items-center text-center relative z-10">
                                    <h3 className="text-xl font-black text-red-500 uppercase mb-1">Le Cimetière</h3>
                                    
                                    {/* Jauge de Chance (ID 3) */}
                                    <div className="bg-slate-900/80 p-2 rounded mb-3 border border-slate-700 w-full shadow-inner">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Succès ({game.membresEquipage?.length} mb)</span>
                                            <span className={`text-lg font-black ${getColor(calculerChance(3))}`}>{calculerChance(3)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${getColor(calculerChance(3)).replace('text', 'bg')}`} style={{width: `${calculerChance(3)}%`}}></div>
                                        </div>
                                    </div>

                                    <div className="text-[10px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded mb-3">DIFFICILE • Niv. Requis: ~150</div>
                                    <p className="text-xs text-slate-300 mb-4">Exploration d'une zone mortelle remplie d'épaves.</p>
                                    
                                    <div className="mt-auto w-full space-y-2">
                                        <div className="flex justify-between text-xs bg-black/40 p-2 rounded">
                                            <span className="text-slate-400">Coût :</span><span className="text-yellow-400 font-bold">50,000 ฿</span>
                                        </div>
                                        <div className="flex justify-between text-xs bg-black/40 p-2 rounded">
                                            <span className="text-slate-400">Durée :</span><span className="text-white font-bold">6 Heures</span>
                                        </div>
                                        <div className="bg-indigo-900/30 border border-indigo-500/30 p-2 rounded mt-2">
                                            <p className="text-[10px] text-indigo-300 uppercase font-bold mb-1">Butin Potentiel</p>
                                            <div className="flex justify-center gap-3 font-bold text-sm">
                                                <span className="text-pink-400">1,5k XP</span><span className="text-yellow-400">150k ฿</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <button onClick={() => game.setShowRaidModal(false)} className="mt-8 mx-auto block px-8 py-3 bg-slate-800 text-slate-400 font-bold rounded-lg hover:bg-slate-700">ANNULER</button>
                    </div>
                </div>
            )}
        </main>
    );
}