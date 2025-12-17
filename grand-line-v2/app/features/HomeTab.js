import React from 'react';
import { getRankInfo } from '../utils/gameUtils';
import DailyQuestsWidget from './DailyQuestsWidget';
import EnergyBar from '../components/EnergyBar'; 

const HomeTab = ({ joueur, statsTotales, topJoueurs, topEquipages, onNavigate, theme, monEquipage, membresEquipage }) => { 
    
    // --- 1. LOGIQUE DE LOCALISATION & SERVICES ---
    const isEnMer = joueur.statut_voyage === 'EN_MER';
    
    // Sécurisation maximale pour le nom du lieu
    const currentLocation = joueur.localisation;
    const locationName = isEnMer 
        ? "En Haute Mer 🌊" 
        : (currentLocation && currentLocation.nom ? currentLocation.nom : "Zone Inconnue");
        
    const facilities = currentLocation?.facilities || [];

    // Helper pour les icônes de services
    const getFacilityEmoji = (type) => {
        switch(type) {
            case 'PORT': return '⚓';
            case 'SHOP': return '🛒';
            case 'ARENE': return '⚔️';
            case 'TAVERNE': return '🍺';
            case 'FORGE': return '🔨';
            case 'CASINO': return '🎰';
            case 'MARCHE': return '⚖️';
            default: return '📍';
        }
    };

    // --- CALCULS STATS ---
    const pvMaxCalcul = statsTotales?.pv_max_total || 100;
    const pvPercent = Math.floor(((joueur.pv_actuel || 0) / pvMaxCalcul) * 100);
    const estBlesse = pvPercent < 100;
    const rankPvP = getRankInfo(joueur.elo_pvp || 0);

    // ÉNERGIE
    const maxEnergie = joueur.max_energie || 10;
    const energieActuelle = joueur.energie_actuelle ?? 0;
    
    // --- LOGIQUE DE VERROUILLAGE (GLOBAL) ---
    const LEVEL_REQ_QUETES = 10;
    const LEVEL_REQ_ARENE = 10;
    const LEVEL_REQ_CLASSEMENT = 10;
    
    const isQuestsLocked = (joueur.niveau || 1) < LEVEL_REQ_QUETES;
    const isRankLocked = (joueur.niveau || 1) < LEVEL_REQ_CLASSEMENT;

    // 🔥 LOGIQUE DE VERROUILLAGE ARÈNE
    const hasArenaHere = !isEnMer && facilities.includes('ARENE');
    const isLevelOkForArena = (joueur.niveau || 1) >= LEVEL_REQ_ARENE;
    
    let arenaBlockReason = null;
    if (!isLevelOkForArena) arenaBlockReason = `Niv ${LEVEL_REQ_ARENE} Requis`;
    else if (isEnMer) arenaBlockReason = "En Mer";
    else if (!hasArenaHere) arenaBlockReason = "Pas d'Arène ici";

    const isAreneBlocked = !!arenaBlockReason;

    // --- HELPER FACTION & COULEURS ---
    const getFactionStyles = (faction) => {
        const f = (faction || "").toUpperCase();
        if (f.includes("MARINE")) return { gradient: "from-blue-400 via-cyan-300 to-blue-600", icon: "⚖️" };
        if (f.includes("REVOLUTION")) return { gradient: "from-red-700 via-orange-600 to-red-900", icon: "🐉" };
        if (f.includes("PIRATE")) return { gradient: "from-red-500 via-orange-400 to-yellow-500", icon: "☠️" };
        return { gradient: "from-slate-300 via-white to-slate-400", icon: "⚓" };
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

    // --- COMPOSANTS UI COMPACTS ---
    const StatBadge = ({ icon, label, value, colorClass }) => (
        <div className="bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-sm shadow-sm min-w-[90px]">
            <span className="text-lg">{icon}</span>
            <div className="flex flex-col text-left leading-none">
                <span className="text-[8px] uppercase text-slate-500 font-bold tracking-wider">{label}</span>
                <span className={`text-xs font-black ${colorClass}`}>{value}</span>
            </div>
        </div>
    );

    const LockedOverlay = ({ label }) => (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 rounded-2xl border border-white/10 select-none cursor-not-allowed transition-colors">
            <div className="bg-black/50 p-2 rounded-full border border-white/10 mb-1">
                <span className="text-xl">🔒</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{label}</span>
        </div>
    );

    return (
        <div className="flex flex-col h-full animate-fadeIn max-w-[95%] mx-auto p-2 pb-16 space-y-4">
            
            {/* 1. EN-TÊTE HERO */}
            <div className="relative text-center py-2">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-16 bg-gradient-to-r ${factionStyle.gradient} opacity-15 blur-2xl rounded-full`}></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl filter drop-shadow-md">{factionStyle.icon}</span>
                        <h1 className={`text-4xl md:text-6xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b ${factionStyle.gradient} font-pirata drop-shadow-sm tracking-wider leading-none`}>
                            {joueur.pseudo}
                        </h1>
                        <span className="text-2xl filter drop-shadow-md scale-x-[-1]">{factionStyle.icon}</span>
                    </div>
                    
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-3">
                        {joueur.faction || "Vagabond des mers"}
                    </p>

                    <div className={`flex flex-wrap justify-center gap-2 transition-all duration-500 ${isRankLocked ? 'opacity-40 blur-[1px] grayscale pointer-events-none' : ''}`}>
                        <StatBadge icon="💪" label="Niveau" value={myRankLevel} colorClass="text-white" />
                        <StatBadge icon="💰" label="Fortune" value={myRankRich} colorClass="text-yellow-400" />
                        <StatBadge icon="⚔️" label="PvP" value={myRankPvP} colorClass="text-red-400" />
                        <StatBadge icon="🏴‍☠️" label="Alliance" value={myRankCrew} colorClass="text-blue-400" />
                    </div>
                </div>
            </div>

            {/* 2. GRID DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
                
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-min">
                    
                    {/* --- CARTE 1 : SANTÉ --- */}
                    <div onClick={() => onNavigate('inventaire')} className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition-all duration-300">
                        <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity rotate-12">💚</div>
                        <div className="relative z-10 flex flex-col h-full justify-between gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-0.5">Santé</h3>
                                    <p className={`text-2xl font-black ${estBlesse ? 'text-red-400' : 'text-white'}`}>
                                        {joueur.pv_actuel} <span className="text-sm text-slate-500 font-normal">/ {pvMaxCalcul}</span>
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg border border-emerald-500/20">💊</div>
                            </div>
                            <div className="space-y-1">
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-black/20">
                                    <div className={`h-full transition-all duration-700 ease-out ${estBlesse ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse' : 'bg-gradient-to-r from-emerald-600 to-teal-400'}`} style={{ width: `${pvPercent}%` }}></div>
                                </div>
                                <p className="text-[9px] text-emerald-500 font-bold uppercase text-right group-hover:translate-x-1 transition-transform">Inventaire →</p>
                            </div>
                        </div>
                    </div>

                    {/* --- CARTE 2 : NAVIGATION (NOUVEAU) --- */}
                    <div onClick={() => onNavigate('map')} className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-blue-400/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        {/* Fond décoratif */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-xl rounded-full translate-x-10 -translate-y-10"></div>
                        <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 group-hover:opacity-15 transition-opacity -rotate-12 text-blue-300">🧭</div>

                        <div className="relative z-10 flex flex-col h-full justify-between gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-[9px] font-bold uppercase text-blue-300 tracking-widest mb-0.5">Position Actuelle</h3>
                                    <p className="text-lg font-black text-white leading-tight line-clamp-2">
                                        {locationName}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 text-lg border border-blue-500/30">
                                    🗺️
                                </div>
                            </div>

                            {/* Liste des Services */}
                            <div className="space-y-1">
                                <div className="flex gap-1 h-5 items-center">
                                    {!isEnMer && facilities.length > 0 ? (
                                        facilities.map((fac) => (
                                            <span key={fac} className="text-sm bg-slate-900/80 px-1.5 py-0.5 rounded border border-white/5" title={fac}>
                                                {getFacilityEmoji(fac)}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-slate-500 italic">{isEnMer ? "En voyage..." : "Zone sauvage"}</span>
                                    )}
                                </div>
                                <p className="text-[9px] text-blue-400 font-bold uppercase text-right group-hover:translate-x-1 transition-transform">
                                    Ouvrir la Carte →
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* --- CARTE 3 : ARÈNE --- */}
                    <div 
                        onClick={() => !isAreneBlocked && onNavigate('arene')}
                        className="md:col-span-2 bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/5 p-4 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-red-500/30 transition-all duration-300"
                    >
                        {isAreneBlocked && <LockedOverlay label={arenaBlockReason} />}
                        
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                        <div className="absolute -right-4 -bottom-6 text-8xl opacity-5 group-hover:opacity-10 transition-opacity rotate-6 text-red-500">⚔️</div>

                        <div className={`relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 ${isAreneBlocked ? 'blur-sm opacity-30' : ''}`}>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-2xl text-red-500 border border-red-500/20 shadow-inner">🥊</div>
                                <div>
                                    <h3 className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-px">Arène PvP</h3>
                                    <h2 className="text-xl font-black text-white italic">COMBATTRE</h2>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <EnergyBar current={energieActuelle} max={maxEnergie} lastUpdate={joueur.last_energie_update} />
                                <p className="text-[9px] text-red-400 font-bold uppercase group-hover:translate-x-1 transition-transform mt-1">Entrer →</p>
                            </div>
                        </div>
                    </div>

                    {/* --- CARTE 4 : RANG & EQUIPAGE --- */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-3">
                        <div onClick={() => !isRankLocked && onNavigate('classement')} className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-yellow-500/30 transition-all duration-300">
                            {isRankLocked && <LockedOverlay label={`Niv ${LEVEL_REQ_CLASSEMENT}`} />}
                            <div className={`flex items-center gap-3 ${isRankLocked ? 'blur-sm opacity-50' : ''}`}>
                                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-xl border border-yellow-500/20 shrink-0">
                                    {rankPvP.img ? <img src={rankPvP.img} alt="" className="w-6 h-6 object-contain" /> : "🏆"}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-[9px] font-bold uppercase text-slate-500 tracking-widest truncate">Classement</h3>
                                    <p className={`text-sm font-black truncate ${rankPvP.color}`}>{rankPvP.label}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-xs border-dashed">
                            🚧 Chantier Naval 🚧
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE : QUÊTES */}
                <div className="lg:col-span-4 h-full">
                    <div className="h-full bg-slate-900/60 border border-white/5 rounded-2xl p-1 relative overflow-hidden">
                        {isQuestsLocked && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-center">
                                <span className="text-3xl mb-2">📜</span>
                                <h3 className="text-sm font-black text-white uppercase mb-1">Bloqué</h3>
                                <p className="text-[10px] text-slate-400">Niveau {LEVEL_REQ_QUETES} requis.</p>
                            </div>
                        )}
                        <div className={`h-full overflow-y-auto custom-scrollbar ${isQuestsLocked ? 'opacity-10 blur-sm' : ''}`}>
                            <DailyQuestsWidget userId={joueur.id} theme={theme} notify={(msg) => console.log(msg)} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HomeTab;