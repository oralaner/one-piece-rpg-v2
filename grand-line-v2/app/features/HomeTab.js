import React from 'react';
import { formatChronoLong, getRankInfo } from '../utils/gameUtils';
import DailyQuestsWidget from './DailyQuestsWidget';

const HomeTab = ({ joueur, statsTotales, expeditionChrono, topJoueurs, topEquipages, onNavigate, theme, monEquipage, membresEquipage }) => { 
    
    // --- CALCULS STATS ---
    const pvMaxCalcul = statsTotales?.pv_max_total || 100;
    const pvPercent = Math.floor(((joueur.pv_actuel || 0) / pvMaxCalcul) * 100);
    const estBlesse = pvPercent < 100;
    const rankPvP = getRankInfo(joueur.elo_pvp || 0);

    // 🔥 MODIFICATION ICI : On utilise la valeur du Backend (lazy reset)
    // Si la donnée n'est pas encore là (chargement), on fallback sur 20 par défaut
    const maxCombats = joueur.combats_max || 20;
    const availableCombats = joueur.combats_restants !== undefined 
        ? joueur.combats_restants 
        : Math.max(0, maxCombats - (joueur.combats_journaliers || 0));
    
    // --- LOGIQUE DE VERROUILLAGE ---
    const LEVEL_REQ_QUETES = 10;
    const LEVEL_REQ_ARENE = 10;
    const LEVEL_REQ_CLASSEMENT = 10;

    // Conditions spécifiques
    const isExpeditionLocked = (joueur.chapitre_actuel || 1) < 2; // Bloqué tant que Chapitre 1
    const isQuestsLocked = (joueur.niveau || 1) < LEVEL_REQ_QUETES;
    const isAreneLocked = (joueur.niveau || 1) < LEVEL_REQ_ARENE;
    const isRankLocked = (joueur.niveau || 1) < LEVEL_REQ_CLASSEMENT;

    // --- HELPER CLASSEMENT ---
    const findRank = (list, value, key) => {
        if (!list || list.length === 0) return "-";
        let searchList = list;
        if (key === 'berrys') {
            searchList = [...list].sort((a, b) => (b.berrys || 0) - (a.berrys || 0));
            key = 'pseudo'; value = joueur.pseudo;
        } else if (key === 'elo_pvp') {
            searchList = [...list].sort((a, b) => (b.elo_pvp || 0) - (a.elo_pvp || 0));
            key = 'pseudo'; value = joueur.pseudo;
        }
        const idx = searchList.findIndex(x => x[key] === value);
        const maxDisplayed = searchList.length > 0 ? searchList.length : 20; 
        const defaultRankString = maxDisplayed > 0 ? `> n°${maxDisplayed}` : "-";
        return idx !== -1 ? `n°${idx + 1}` : defaultRankString;
    };

    // --- RANGS ---
    const myRankLevel = findRank(topJoueurs, joueur.pseudo, 'pseudo'); 
    const myRankRich = findRank(topJoueurs, null, 'berrys');
    const myRankPvP = findRank(topJoueurs, null, 'elo_pvp');
    const myRankCrew = joueur.equipage_id ? findRank(topEquipages, joueur.equipage_id, 'id') : "-";

    // --- COMPOSANT DE BLOC VERROUILLÉ ---
    const LockedOverlay = ({ label }) => (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-2xl border border-white/10 select-none cursor-not-allowed">
            <span className="text-3xl mb-1">🔒</span>
            <span className="text-[10px] font-bold uppercase text-slate-400">{label}</span>
        </div>
    );

    return (
        <div className="flex flex-col h-full animate-fadeIn max-w-6xl mx-auto p-2 pb-20">
            
            {/* 1. EN-TÊTE TYPO + RÉCAP CLASSEMENTS */}
            <div className="text-center mb-8 relative">
                <h1 className="text-5xl md:text-7xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-red-600 font-pirata drop-shadow-lg tracking-wider mb-4">
                    {joueur.pseudo}
                </h1>
                
                {/* BANDEAU DES RANGS (Flouté si bas niveau) */}
                <div className={`flex flex-wrap justify-center gap-2 md:gap-4 mb-4 transition-all duration-500 ${isRankLocked ? 'opacity-20 blur-sm grayscale pointer-events-none select-none' : ''}`}>
                    <div className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-lg">💪</span>
                        <div className="text-left leading-none"><span className="text-[9px] uppercase text-slate-500 font-bold block">Niveau</span><span className="text-sm font-black text-white">{myRankLevel}</span></div>
                    </div>
                    <div className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-lg">💰</span>
                        <div className="text-left leading-none"><span className="text-[9px] uppercase text-slate-500 font-bold block">Fortune</span><span className="text-sm font-black text-yellow-400">{myRankRich}</span></div>
                    </div>
                    <div className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-lg">⚔️</span>
                        <div className="text-left leading-none"><span className="text-[9px] uppercase text-slate-500 font-bold block">PvP</span><span className="text-sm font-black text-red-400">{myRankPvP}</span></div>
                    </div>
                    <div className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-lg">🏴‍☠️</span>
                        <div className="text-left leading-none"><span className="text-[9px] uppercase text-slate-500 font-bold block">Alliance</span><span className="text-sm font-black text-blue-400">{myRankCrew}</span></div>
                    </div>
                </div>
                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-slate-700 to-transparent mx-auto"></div>
            </div>

            {/* 2. CONTENU PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLONNE GAUCHE (2/3) */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* BLOC 1 : ÉTAT PHYSIQUE (Toujours Ouvert) */}
                    <div onClick={() => onNavigate('inventaire')} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-6 rounded-2xl flex items-center gap-5 cursor-pointer group transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/20 relative">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-3xl text-emerald-400 group-hover:scale-110 transition-transform">💚</div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1">État Physique</h4>
                            <p className={`text-2xl font-black ${estBlesse ? 'text-red-400 animate-pulse' : 'text-white'}`}>{joueur.pv_actuel} / {pvMaxCalcul} PV</p>
                            <p className="text-xs font-bold text-cyan-400 mt-1 group-hover:translate-x-1 transition-transform">Gérer l'inventaire →</p>
                        </div>
                    </div>

                    {/* BLOC 2 : EXPÉDITIONS (Bloqué Chap < 2) */}
                    <div className="relative bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl flex items-center gap-5 transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-900/20 cursor-pointer"
                         onClick={() => !isExpeditionLocked && onNavigate('expeditions')}>
                        
                        {isExpeditionLocked && <LockedOverlay label="Finir Chapitre 1" />}

                        <div className={`w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl text-indigo-400 group-hover:scale-110 transition-transform ${isExpeditionLocked ? 'blur-sm' : ''}`}>🧭</div>
                        <div className={isExpeditionLocked ? 'blur-sm opacity-50' : ''}>
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1">Expéditions</h4>
                            {joueur.expedition_fin ? (
                                <>
                                    <p className="text-xl font-mono font-black text-indigo-300 animate-pulse">{formatChronoLong(expeditionChrono)}</p>
                                    <p className="text-xs font-bold text-indigo-400 mt-1 group-hover:translate-x-1 transition-transform animate-pulse">En cours...</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-2xl font-black text-white">Prêt au départ !</p>
                                    <p className="text-xs font-bold text-indigo-400 mt-1 group-hover:translate-x-1 transition-transform">Ouvrir la carte →</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* BLOC 3 : ARÈNE (Bloqué Niv < 5) */}
                    <div className="relative bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl flex items-center gap-5 transition-all duration-300 group hover:shadow-lg hover:shadow-red-900/20 cursor-pointer"
                         onClick={() => !isAreneLocked && onNavigate('arene')}>
                        
                        {isAreneLocked && <LockedOverlay label={`Niveau ${LEVEL_REQ_ARENE} Requis`} />}

                        <div className={`w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-3xl text-red-400 group-hover:scale-110 transition-transform ${isAreneLocked ? 'blur-sm' : ''}`}>⚔️</div>
                        <div className={isAreneLocked ? 'blur-sm opacity-50' : ''}>
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1">Arène PvP</h4>
                            
                            {/* 🔥 MODIFICATION AFFICHAGE COMBATS */}
                            <p className="text-2xl font-black text-white">
                                {availableCombats} / {maxCombats} combats
                            </p>
                            
                            <p className="text-xs font-bold text-red-400 mt-1 group-hover:translate-x-1 transition-transform">Combattre →</p>
                        </div>
                    </div>

                    {/* BLOC 4 : RANG (Bloqué Niv < 10) */}
                    <div className="relative bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl flex items-center gap-5 transition-all duration-300 group hover:shadow-lg hover:shadow-yellow-900/20 cursor-pointer"
                         onClick={() => !isRankLocked && onNavigate('classement')}>
                        
                        {isRankLocked && <LockedOverlay label={`Niveau ${LEVEL_REQ_CLASSEMENT} Requis`} />}

                        <div className={`w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center p-2 group-hover:scale-110 transition-transform ${isRankLocked ? 'blur-sm' : ''}`}>
                            {rankPvP.img ? <img src={rankPvP.img} alt={rankPvP.label} className="w-full h-full object-contain drop-shadow-md" /> : <span className="text-3xl">🏆</span>}
                        </div>
                        <div className={isRankLocked ? 'blur-sm opacity-50' : ''}>
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1">Mon Rang</h4>
                            <p className={`text-xl font-black ${rankPvP.color}`}>{rankPvP.label}</p>
                            <p className="text-xs font-bold text-yellow-500 mt-1 group-hover:translate-x-1 transition-transform font-mono">{rankPvP.lp} LP</p>
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE (1/3) : QUÊTES QUOTIDIENNES (Bloqué Niv < 3) */}
                <div className="lg:col-span-1 relative">
                    {isQuestsLocked && (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 rounded-2xl border border-white/10 flex flex-col items-center justify-center select-none">
                            <span className="text-4xl mb-2">📜</span>
                            <span className="text-xs font-bold uppercase text-slate-400">Contrats indisponibles</span>
                            <span className="text-lg font-black text-yellow-500">Niveau {LEVEL_REQ_QUETES}</span>
                        </div>
                    )}
                    
                    {/* Contenu flouté si bloqué */}
                    <div className={isQuestsLocked ? 'opacity-20 blur-sm pointer-events-none h-full' : 'h-full'}>
                        <DailyQuestsWidget 
                            userId={joueur.id} 
                            theme={theme} 
                            notify={(msg, type) => console.log(msg)} 
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HomeTab;