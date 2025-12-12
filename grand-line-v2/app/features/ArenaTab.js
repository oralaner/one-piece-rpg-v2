import React, { useState } from 'react';
import { getRankInfo } from '../utils/gameUtils';
import EnergyBar from '../components/EnergyBar'; 

const CombatTab = ({ adversaires, onFight, onRefresh, energy, maxEnergy = 10, lastUpdate, theme }) => {
    
    // Debug pour vérifier ce qui arrive
    console.log("DEBUG ARENA - Energy:", energy, "Max:", maxEnergy, "Date:", lastUpdate);

    const [searchTerm, setSearchTerm] = useState("");

    // Filtrage local
    const filteredList = adversaires.filter(adv => 
        !searchTerm || adv.pseudo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fadeIn pb-10 pt-2">
            
            {/* --- HEADER : ÉNERGIE --- */}
            <div className={`p-5 rounded-2xl border-b-4 shadow-xl relative overflow-hidden ${theme.btnPrimary}`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest text-white font-pirata drop-shadow-md">Le Colisée</h2>
                        <p className="text-xs opacity-90 font-bold uppercase tracking-wide">Prouvez votre valeur</p>
                    </div>

                    <div className="flex justify-end">
                        <EnergyBar 
                            current={energy} 
                            max={maxEnergy} 
                            lastUpdate={lastUpdate} 
                        />
                    </div>
                </div>
            </div>

            {/* --- CONTRÔLES (Recherche seule) --- */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="Rechercher un rival..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 bg-slate-900/80 border border-slate-600 rounded-xl px-4 pl-10 text-white text-sm focus:border-yellow-400 outline-none transition"
                    />
                    <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
                </div>
                <button onClick={onRefresh} className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 transition shadow-lg">🔄</button>
            </div>

            {/* --- LISTE --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredList.length === 0 ? (
                    <div className="col-span-full text-center py-16 opacity-50 border-2 border-dashed border-slate-700 rounded-xl">
                        <span className="text-4xl mb-2">🌵</span>
                        <p className="italic text-slate-400">Aucun adversaire trouvé.</p>
                    </div>
                ) : (
                    filteredList.map((adv) => {
                        const rank = getRankInfo(adv.elo_pvp);
                        let factionColor = "text-slate-500";
                        let factionBorder = "border-slate-700";
                        let factionBg = "bg-slate-800";

                        if (adv.faction === 'Pirate') { factionColor = "text-red-500"; factionBorder = "border-red-900/50"; factionBg = "bg-red-950/10"; }
                        if (adv.faction === 'Marine') { factionColor = "text-cyan-400"; factionBorder = "border-cyan-900/50"; factionBg = "bg-cyan-950/10"; }
                        if (adv.faction === 'Révolutionnaire') { factionColor = "text-emerald-500"; factionBorder = "border-emerald-900/50"; factionBg = "bg-emerald-950/10"; }

                        return (
                            <div key={adv.id} className={`relative group flex flex-col bg-slate-900/80 border ${factionBorder} rounded-xl p-4 shadow-lg hover:border-white/20 transition-all overflow-hidden`}>
                                <div className={`absolute inset-0 ${factionBg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="relative shrink-0">
                                        <div className="w-16 h-16 rounded-xl bg-slate-950 border-2 border-white/10 overflow-hidden shadow-inner">
                                            {adv.avatar_url ? <img src={adv.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
                                        </div>
                                        
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center shadow-md" title={rank.fullLabel}>
                                            {rank.img ? <img src={rank.img} className="w-5 h-5 object-contain"/> : <span className="text-xs">🏆</span>}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-white text-lg truncate leading-none">{adv.pseudo}</h3>
                                            {adv.titre_actuel && <span className="text-[8px] bg-yellow-900/30 text-yellow-500 border border-yellow-600/30 px-1.5 rounded truncate max-w-[100px]">{adv.titre_actuel}</span>}
                                        </div>
                                        
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${factionColor}`}>{adv.faction || 'Errant'}</p>
                                        
                                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                            <span className="text-slate-400 bg-black/40 px-2 py-0.5 rounded font-mono border border-white/5">Niv {adv.niveau}</span>
                                            <span className={`${rank.color} font-black border border-white/5 bg-black/20 px-2 py-0.5 rounded flex items-center gap-1`}>
                                                {rank.label} <span className="text-white/60 font-normal text-[10px]">| {rank.lp} LP</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => onFight(adv)} className={`mt-4 w-full py-3 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${theme.btnPrimary} relative z-10 group-hover:brightness-110`}>
                                    <span>⚔️</span> DÉFIER
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CombatTab;