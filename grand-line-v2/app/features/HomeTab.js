import React from 'react';
import { formatChronoLong, getRankInfo } from '../utils/gameUtils';
import DailyQuestsWidget from './DailyQuestsWidget';
import EnergyBar from '../components/EnergyBar'; 

const HomeTab = ({ joueur, statsTotales, expeditionChrono, topJoueurs, topEquipages, onNavigate, theme, monEquipage, membresEquipage }) => { 
    
    // --- CALCULS STATS ---
    const pvMaxCalcul = statsTotales?.pv_max_total || 100;
    const pvPercent = Math.floor(((joueur.pv_actuel || 0) / pvMaxCalcul) * 100);
    const estBlesse = pvPercent < 100;
    const rankPvP = getRankInfo(joueur.elo_pvp || 0);

    // ÉNERGIE
    const maxEnergie = joueur.max_energie || 10;
    const energieActuelle = joueur.energie_actuelle ?? 0;
    
    // --- LOGIQUE DE VERROUILLAGE ---
    const LEVEL_REQ_QUETES = 10;
    const LEVEL_REQ_ARENE = 10;
    const LEVEL_REQ_CLASSEMENT = 10;

    const isExpeditionLocked = (joueur.chapitre_actuel || 1) < 2; 
    const isQuestsLocked = (joueur.niveau || 1) < LEVEL_REQ_QUETES;
    const isAreneLocked = (joueur.niveau || 1) < LEVEL_REQ_ARENE;
    const isRankLocked = (joueur.niveau || 1) < LEVEL_REQ_CLASSEMENT;

    // --- HELPER FACTION & COULEURS ---
    const getFactionStyles = (faction) => {
        const f = (faction || "").toUpperCase();
        if (f.includes("MARINE")) return { 
            gradient: "from-blue-400 via-cyan-300 to-blue-600", 
            shadow: "shadow-blue-500/50",
            icon: "⚖️"
        };
        if (f.includes("REVOLUTION") || f.includes("RÉVOLUTION")) return { 
            gradient: "from-red-700 via-orange-600 to-red-900", 
            shadow: "shadow-red-900/50",
            icon: "🐉"
        };
        if (f.includes("PIRATE")) return { 
            gradient: "from-red-500 via-orange-400 to-yellow-500", 
            shadow: "shadow-orange-500/50",
            icon: "☠️"
        };
        return { 
            gradient: "from-slate-300 via-white to-slate-400", 
            shadow: "shadow-white/20",
            icon: "⚓"
        };
    };

    const factionStyle = getFactionStyles(joueur.faction);

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
        return idx !== -1 ? `n°${idx + 1}` : "-";
    };

    const myRankLevel = findRank(topJoueurs, joueur.pseudo, 'pseudo'); 
    const myRankRich = findRank(topJoueurs, null, 'berrys');
    const myRankPvP = findRank(topJoueurs, null, 'elo_pvp');
    const myRankCrew = joueur.equipage_id ? findRank(topEquipages, joueur.equipage_id, 'id') : "-";

    // --- COMPOSANTS UI ---
    
    // Badge de Stats (sous le pseudo)
    const StatBadge = ({ icon, label, value, colorClass }) => (
        <div className="bg-slate-900/60 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3 backdrop-blur-sm shadow-lg min-w-[120px]">
            <span className="text-xl">{icon}</span>
            <div className="flex flex-col text-left leading-none">
                <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">{label}</span>
                <span className={`text-sm font-black ${colorClass}`}>{value}</span>
            </div>
        </div>
    );

    // Overlay Verrouillé
    const LockedOverlay = ({ label }) => (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 rounded-2xl border border-white/5 select-none cursor-not-allowed group-hover:bg-slate-950/70 transition-colors">
            <div className="bg-black/50 p-3 rounded-full border border-white/10 mb-2">
                <span className="text-2xl">🔒</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{label}</span>
        </div>
    );

    return (
        <div className="flex flex-col h-full animate-fadeIn max-w-7xl mx-auto p-4 pb-24 space-y-8">
            
            {/* 1. EN-TÊTE HERO */}
            <div className="relative text-center py-6">
                {/* Lueur d'ambiance derrière le pseudo */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-24 bg-gradient-to-r ${factionStyle.gradient} opacity-20 blur-3xl rounded-full`}></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    {/* Faction & Pseudo */}
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl filter drop-shadow-lg">{factionStyle.icon}</span>
                        <h1 className={`text-5xl md:text-7xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b ${factionStyle.gradient} font-pirata drop-shadow-sm tracking-wider`}>
                            {joueur.pseudo}
                        </h1>
                        <span className="text-3xl filter drop-shadow-lg scale-x-[-1]">{factionStyle.icon}</span>
                    </div>
                    
                    {/* Sous-titre Faction */}
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-6">
                        {joueur.faction || "Vagabond des mers"}
                    </p>

                    {/* Barre des Rangs */}
                    <div className={`flex flex-wrap justify-center gap-3 transition-all duration-500 ${isRankLocked ? 'opacity-40 blur-[1px] grayscale pointer-events-none' : ''}`}>
                        <StatBadge icon="💪" label="Niveau" value={myRankLevel} colorClass="text-white" />
                        <StatBadge icon="💰" label="Fortune" value={myRankRich} colorClass="text-yellow-400" />
                        <StatBadge icon="⚔️" label="PvP" value={myRankPvP} colorClass="text-red-400" />
                        <StatBadge icon="🏴‍☠️" label="Alliance" value={myRankCrew} colorClass="text-blue-400" />
                    </div>
                </div>
            </div>

            {/* 2. GRID DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COLONNE PRINCIPALE (8/12) */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                    
                    {/* CARTE 1 : SANTÉ (Inventaire) */}
                    <div 
                        onClick={() => onNavigate('inventaire')} 
                        className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                    >
                        {/* Fond décoratif */}
                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-5 group-hover:opacity-10 transition-opacity rotate-12">💚</div>
                        
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">État de santé</h3>
                                    <p className={`text-3xl font-black ${estBlesse ? 'text-red-400' : 'text-white'}`}>
                                        {joueur.pv_actuel} <span className="text-lg text-slate-500 font-normal">/ {pvMaxCalcul}</span>
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl border border-emerald-500/20">
                                    💊
                                </div>
                            </div>
                            
                            {/* Barre de vie */}
                            <div className="space-y-2">
                                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-black/20">
                                    <div 
                                        className={`h-full transition-all duration-700 ease-out ${estBlesse ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse' : 'bg-gradient-to-r from-emerald-600 to-teal-400'}`} 
                                        style={{ width: `${pvPercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase text-right group-hover:translate-x-1 transition-transform">
                                    Ouvrir l'inventaire →
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CARTE 2 : EXPÉDITIONS */}
                    <div 
                        onClick={() => !isExpeditionLocked && onNavigate('expeditions')}
                        className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-indigo-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
                    >
                        {isExpeditionLocked && <LockedOverlay label="Chapitre 1 Requis" />}
                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-5 group-hover:opacity-10 transition-opacity -rotate-12">🧭</div>

                        <div className={`relative z-10 flex flex-col h-full justify-between ${isExpeditionLocked ? 'blur-sm opacity-50' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">Exploration</h3>
                                    <div className="mt-1">
                                        {joueur.expedition_fin ? (
                                            <div>
                                                <p className="text-2xl font-black text-indigo-300 font-mono tracking-tight animate-pulse">
                                                    {formatChronoLong(expeditionChrono)}
                                                </p>
                                                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">En cours</span>
                                            </div>
                                        ) : (
                                            <p className="text-2xl font-black text-white">Disponible</p>
                                        )}
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xl border border-indigo-500/20">
                                    🗺️
                                </div>
                            </div>

                            <p className="text-[10px] text-indigo-400 font-bold uppercase text-right mt-4 group-hover:translate-x-1 transition-transform">
                                {joueur.expedition_fin ? "Voir le voyage →" : "Lancer une expédition →"}
                            </p>
                        </div>
                    </div>

                    {/* CARTE 3 : ARÈNE (Large) */}
                    <div 
                        onClick={() => !isAreneLocked && onNavigate('arene')}
                        className="md:col-span-2 bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/5 p-6 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-red-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                    >
                        {isAreneLocked && <LockedOverlay label={`Niveau ${LEVEL_REQ_ARENE} Requis`} />}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                        <div className="absolute -right-2 -bottom-8 text-[10rem] opacity-5 group-hover:opacity-10 transition-opacity rotate-6 text-red-500">⚔️</div>

                        <div className={`relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 ${isAreneLocked ? 'blur-sm opacity-50' : ''}`}>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-3xl text-red-500 border border-red-500/20 shadow-inner">
                                    🥊
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-0.5">Arène PvP</h3>
                                    <h2 className="text-2xl font-black text-white italic">COMBATTRE</h2>
                                </div>
                            </div>

                            {/* Section Énergie */}
                            <div className="flex flex-col items-end gap-1">
                                <EnergyBar 
                                    current={energieActuelle} 
                                    max={maxEnergie} 
                                    lastUpdate={joueur.last_energie_update} 
                                />
                                <p className="text-[10px] text-red-400 font-bold uppercase group-hover:translate-x-1 transition-transform mt-2">
                                    Entrer dans l'arène →
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CARTE 4 : RANG (Petit bloc) */}
                    <div 
                        onClick={() => !isRankLocked && onNavigate('classement')}
                        className="bg-slate-900/60 border border-white/5 p-5 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-yellow-500/30 transition-all duration-300"
                    >
                        {isRankLocked && <LockedOverlay label={`Niveau ${LEVEL_REQ_CLASSEMENT}`} />}
                        <div className={`flex items-center gap-4 ${isRankLocked ? 'blur-sm opacity-50' : ''}`}>
                             <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-2xl border border-yellow-500/20">
                                {rankPvP.img ? <img src={rankPvP.img} alt="" className="w-8 h-8 object-contain" /> : "🏆"}
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Classement</h3>
                                <p className={`text-lg font-black ${rankPvP.color}`}>{rankPvP.label}</p>
                            </div>
                        </div>
                    </div>

                    {/* CARTE 5 : PLACEHOLDER OU EQUIPAGE (Petit bloc) */}
                    <div className="bg-slate-900/40 border border-white/5 p-5 rounded-3xl flex items-center justify-center text-slate-600 font-bold text-sm border-dashed">
                        ... Bientôt ...
                    </div>

                </div>

                {/* COLONNE DROITE (4/12) : QUÊTES */}
                <div className="lg:col-span-4 h-full min-h-[400px]">
                    <div className="h-full bg-slate-900/60 border border-white/5 rounded-3xl p-1 relative overflow-hidden">
                        {isQuestsLocked && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6 text-center">
                                <span className="text-4xl mb-4">📜</span>
                                <h3 className="text-lg font-black text-white uppercase mb-1">Contrats Bloqués</h3>
                                <p className="text-xs text-slate-400">Atteignez le niveau {LEVEL_REQ_QUETES} pour débloquer les quêtes journalières.</p>
                            </div>
                        )}
                        
                        <div className={`h-full ${isQuestsLocked ? 'opacity-10 blur-sm' : ''}`}>
                            <DailyQuestsWidget 
                                userId={joueur.id} 
                                theme={theme} 
                                notify={(msg, type) => console.log(msg)} 
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HomeTab;