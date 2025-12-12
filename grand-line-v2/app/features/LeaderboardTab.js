import React, { useState } from 'react';
import { getRankInfo } from '../utils/gameUtils';

const LeaderboardTab = ({ players, crews, theme, currentUser, setType }) => {
    
    // On sépare l'affichage (local) de la requête (parent)
    const [localType, setLocalType] = useState('NIVEAU'); 
    const [search, setSearch] = useState("");

    const handleTypeChange = (newType) => {
        setLocalType(newType);
        setType(newType);
    };

    // Configuration des filtres
    const filters = [
        { id: 'PVP', label: '⚔️ PvP', desc: 'Les meilleurs combattants' },
        { id: 'NIVEAU', label: '💪 Niveau', desc: 'Les plus expérimentés' },
        { id: 'RICHESSE', label: '💰 Fortune', desc: 'Les plus riches' },
        { id: 'EQUIPAGE', label: '🏴‍☠️ Alliances', desc: 'Les guildes dominantes' }
    ];

    // Logique "Mon Rang"
    let myRank = "> 50";
    let myValue = "-";
    
    if (localType !== 'EQUIPAGE' && players) {
        const myIndex = players.findIndex(p => p.pseudo === currentUser.pseudo);
        if (myIndex !== -1) {
            myRank = `#${myIndex + 1}`;
            if (localType === 'PVP') myValue = `${players[myIndex].elo_pvp} LP`;
            if (localType === 'RICHESSE') myValue = `${players[myIndex].berrys.toLocaleString()} ฿`;
            if (localType === 'NIVEAU') myValue = `Niv ${players[myIndex].niveau}`;
        } else {
            if (localType === 'PVP') myValue = `${currentUser.elo_pvp} LP`;
            if (localType === 'RICHESSE') myValue = `${currentUser.berrys.toLocaleString()} ฿`;
            if (localType === 'NIVEAU') myValue = `Niv ${currentUser.niveau}`;
        }
    }

    // Styles pour les 3 premiers
    const getRankStyle = (index) => {
        if (index === 0) return { bg: 'bg-yellow-900/20', border: 'border-yellow-500', text: 'text-yellow-400', icon: '👑' };
        if (index === 1) return { bg: 'bg-slate-400/10', border: 'border-slate-300', text: 'text-slate-300', icon: '🥈' };
        if (index === 2) return { bg: 'bg-orange-900/20', border: 'border-orange-600', text: 'text-orange-500', icon: '🥉' };
        return { bg: 'bg-slate-900/50', border: 'border-slate-800', text: 'text-slate-500', icon: `#${index + 1}` };
    };

    const getFactionColor = (faction) => {
        if (faction === 'Pirate') return 'text-red-500';
        if (faction === 'Marine') return 'text-cyan-400';
        if (faction === 'Révolutionnaire') return 'text-emerald-500';
        return 'text-slate-400';
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10 pt-2">
            
            {/* --- HEADER --- */}
            <div className={`p-5 rounded-2xl border-b-4 shadow-xl relative overflow-hidden ${theme.btnPrimary}`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white font-pirata drop-shadow-md">Hall of Fame</h2>
                    <p className="text-xs opacity-90 font-bold uppercase tracking-wide mb-4">L'élite de Grand Line</p>
                    
                    <div className="flex flex-wrap justify-center gap-2 w-full">
                        {filters.map(f => (
                            <button 
                                key={f.id}
                                onClick={() => handleTypeChange(f.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-lg border-2
                                ${localType === f.id 
                                    ? 'bg-white text-slate-900 border-white scale-105 z-10' 
                                    : 'bg-black/30 text-white/70 border-transparent hover:bg-black/50 hover:text-white'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MON RANG (Résumé) --- */}
            {localType !== 'EQUIPAGE' && (
                <div className="bg-slate-800/80 border-2 border-yellow-500/50 p-3 rounded-xl shadow-lg flex items-center justify-between relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                    <div className="flex items-center gap-3 ml-2">
                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/20 overflow-hidden">
                            {currentUser.avatar_url ? <img src={currentUser.avatar_url} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full">👤</div>}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Votre Rang</p>
                            <p className="font-black text-white text-lg leading-none">{currentUser.pseudo}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-yellow-400 font-mono">{myRank}</p>
                        <p className="text-[10px] font-bold text-white/60">{myValue}</p>
                    </div>
                </div>
            )}

            {/* --- RECHERCHE --- */}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder={`Rechercher ${localType === 'EQUIPAGE' ? 'une alliance' : 'un joueur'}...`} 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 bg-slate-900/80 border border-slate-700 rounded-xl px-4 pl-10 text-white text-sm focus:border-white/50 outline-none transition shadow-inner"
                />
                <span className="absolute left-3 top-3.5 text-slate-500">🔍</span>
            </div>

            {/* --- LISTE DES RANGS --- */}
            <div className="space-y-2">
                
                {/* CAS 1 : ALLIANCES */}
                {localType === 'EQUIPAGE' ? (
                    crews.filter(c => !search || c.nom.toLowerCase().includes(search.toLowerCase())).map((crew, i) => {
                        const style = getRankStyle(i);
                        return (
                            <div key={i} className={`flex items-center p-3 rounded-xl border-l-4 bg-black/20 shadow-md transition hover:bg-black/40 ${style.bg} ${style.border} ${i < 3 ? 'border-y border-r border-white/10' : 'border-slate-800'}`}>
                                <div className={`w-8 flex justify-center text-lg font-black ${style.text}`}>{style.icon}</div>
                                <div className="flex-1 pl-3">
                                    <h3 className="font-black text-white uppercase text-sm">{crew.nom}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        Niv {crew.niveau} • {crew.membres ? crew.membres.length : '?'} Membres
                                    </p>
                                </div>
                                <div className="text-right bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Banque</span>
                                    <span className="text-yellow-400 font-black font-mono">
                                        {parseInt(crew.berrys_banque || 0).toLocaleString()} ฿
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    // CAS 2 : JOUEURS (Liste simple)
                    players.filter(p => !search || p.pseudo.toLowerCase().includes(search.toLowerCase())).map((p, i) => {
                        const isMe = p.pseudo === currentUser?.pseudo;
                        const style = getRankStyle(i);
                        const rankPvP = getRankInfo(p.elo_pvp);
                        const factionColor = getFactionColor(p.faction);

                        return (
                            <div key={i} className={`relative flex items-center p-2 md:p-3 rounded-xl border-l-4 transition-all hover:scale-[1.01]
                                ${style.bg} ${style.border} ${i < 3 ? 'border-y border-r border-white/10' : 'bg-slate-900/50 border-slate-800'}
                                ${isMe ? 'ring-1 ring-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : ''}`}
                            >
                                {/* Rang */}
                                <div className={`w-8 shrink-0 flex justify-center text-lg font-black ${style.text}`}>
                                    {style.icon}
                                </div>

                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0 mx-2 relative">
                                    {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-lg">👤</div>}
                                </div>

                                {/* Infos */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <h3 className={`font-black text-sm truncate ${isMe ? 'text-yellow-400' : 'text-slate-200'}`}>{p.pseudo}</h3>
                                        {p.titre_actuel && <span className="text-[8px] text-yellow-500/80 border border-yellow-500/20 px-1 rounded bg-yellow-900/10 truncate max-w-[100px] hidden md:inline-block">{p.titre_actuel}</span>}
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${factionColor}`}>
                                        {p.faction || 'Sans faction'}
                                    </p>
                                </div>

                                {/* Valeur (selon filtre) */}
                                <div className="text-right pl-2">
                                    {localType === 'PVP' && (
                                        <div className="flex flex-col items-end">
                                            <span className={`text-sm font-black ${rankPvP.color}`}>{p.elo_pvp} LP</span>
                                            
                                            <span className="text-[9px] text-slate-500 font-bold uppercase">{rankPvP.label}</span>
                                        </div>
                                    )}
                                    {localType === 'RICHESSE' && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-yellow-400">{p.berrys.toLocaleString()} ฿</span>
                                        </div>
                                    )}
                                    {localType === 'NIVEAU' && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-white">Niv {p.niveau}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default LeaderboardTab;