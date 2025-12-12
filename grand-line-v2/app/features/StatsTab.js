import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { getStatCost } from '../utils/gameUtils';

const StatsTab = ({ joueur, statsTotales, theme }) => {
    const queryClient = useQueryClient();
    
    // État pour savoir QUEL bouton tourne (pour l'effet sablier)
    const [currentLoadingStat, setCurrentLoadingStat] = useState(null);

    // 1. MUTATION (Appel API)
    const investMutation = useMutation({
        mutationFn: async (statName) => {
            return await api.post('/game/stats/invest', { userId: joueur.id, stat: statName });
        },
        onSuccess: () => {
            // Recharge les données pour mettre à jour l'affichage
            queryClient.invalidateQueries(['playerData']);
        },
        onError: (err) => {
            console.error("Erreur stats:", err);
            alert("Erreur : " + (err.message || "Impossible d'augmenter la stat"));
        },
        onSettled: () => {
            // Quoi qu'il arrive (succès ou erreur), on débloque le bouton
            setCurrentLoadingStat(null);
        }
    });

    const statsConfig = [
        { code: 'vitalite', label: 'Vitalité', img: 'vitalite.png', color: 'text-pink-400', border: 'border-pink-500', shadow: 'shadow-pink-500/50', desc: "Augmentation de la vie max" },
        { code: 'force', label: 'Force', img: 'force.png', color: 'text-orange-500', border: 'border-orange-950', shadow: 'shadow-orange-950/50', desc: "Augmentation des Dégâts Physique" },
        { code: 'agilite', label: 'Agilité', img: 'agilite.png', color: 'text-green-400', border: 'border-green-500', shadow: 'shadow-green-500/50', desc: "Augmentation de l'Esquive & des dégâts au Tir" },
        { code: 'intelligence', label: 'Intel.', img: 'intelligence.png', color: 'text-red-600', border: 'border-red-600', shadow: 'shadow-red-600/50', desc: "Augmentation de la Défense & du Soin" },
        { code: 'chance', label: 'Chance', img: 'chance.png', color: 'text-blue-400', border: 'border-blue-500', shadow: 'shadow-blue-500/50', desc: "Augmentation des Coups Critiques & de l'Or gagné" },
        { code: 'sagesse', label: 'Sagesse', img: 'sagesse.png', color: 'text-purple-400', border: 'border-purple-500', shadow: 'shadow-purple-500/50', desc: "Augmentation du Gain XP" }
    ];

    if (!joueur || !statsTotales) {
        return <div className="text-center animate-pulse py-10 text-slate-500">Chargement des stats...</div>;
    }

    return (
        <div className="space-y-8 animate-fadeIn pb-10 pt-4">
            
            {/* --- HEADER --- */}
            <div className={`flex items-center justify-between p-5 rounded-2xl border-b-4 shadow-xl ${theme.btnPrimary} relative overflow-hidden`}>
                <div className="relative z-10">
                    <p className="text-xs uppercase font-bold text-white/70 tracking-[0.2em] mb-1">Points disponibles</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-black text-white font-pirata drop-shadow-lg leading-none">
                            {joueur.points_carac}
                        </p>
                        <span className="text-sm font-bold opacity-80">pts</span>
                    </div>
                </div>
                <div className="text-5xl opacity-30 grayscale brightness-200 animate-pulse absolute right-4 bottom-2">✨</div>
            </div>

            {/* --- GRILLE DES MÉDAILLONS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pl-6">
                {statsConfig.map((stat) => {
                    const baseVal = joueur[stat.code] || 0;
                    const totalVal = statsTotales[stat.code] || baseVal;
                    const bonus = totalVal - baseVal;
                    
                    const cout = getStatCost(baseVal);
                    
                    // Conditions pour cliquer
                    const hasPoints = (joueur.points_carac || 0) >= cout;
                    const isGlobalLoading = currentLoadingStat !== null; // Un autre bouton charge ?
                    const isThisLoading = currentLoadingStat === stat.code; // C'est moi qui charge ?
                    
                    const isDisabled = !hasPoints || isGlobalLoading;

                    return (
                        <div key={stat.code} className="relative flex items-center group h-[110px]">
                            
                            {/* 1. LE MÉDAILLON */}
                            <div className={`absolute -left-6 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-slate-900 border-4 ${stat.border} flex items-center justify-center z-20 shadow-lg ${stat.shadow} transition-transform duration-300 group-hover:scale-105`}>
                                <img 
                                    src={`/stats/${stat.img}`} 
                                    alt={stat.label}
                                    className="w-14 h-14 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
                                    onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2740/2740648.png"; }}
                                />
                                <div className={`absolute inset-0 rounded-full opacity-30 bg-gradient-to-tr from-transparent via-white to-transparent mix-blend-overlay pointer-events-none`}></div>
                            </div>

                            {/* 2. LA CARTE D'INFOS & ACTION */}
                            <div className={`flex-1 h-full flex items-stretch justify-between bg-slate-900/90 border ${theme.borderLow} rounded-r-2xl rounded-l-lg shadow-md pl-20 pr-2 py-2 relative z-10 overflow-hidden group-hover:border-white/30 transition-all`}>
                                
                                {/* Infos */}
                                <div className="flex flex-col justify-center py-1 flex-1 min-w-0">
                                    <h3 className={`text-sm font-black uppercase tracking-wider ${stat.color} mb-0.5`}>
                                        {stat.label}
                                    </h3>
                                    
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <span className="text-3xl font-black text-white font-pirata leading-none">
                                            {totalVal}
                                        </span>
                                        {bonus > 0 && (
                                            <span className="text-[9px] font-bold text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded border border-green-500/30 whitespace-nowrap">
                                                +{bonus} Equip.
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 truncate font-medium mt-1 pr-2">
                                        {stat.desc}
                                    </p>
                                </div>

                                {/* Bouton Action */}
                                <div className="flex items-center ml-2 shrink-0">
                                    <button 
                                        disabled={isDisabled}
                                        onClick={() => {
                                            if (!isDisabled) {
                                                setCurrentLoadingStat(stat.code); // On verrouille
                                                investMutation.mutate(stat.code); // On envoie
                                            } else {
                                                console.log("Clic bloqué : Pas assez de points ou chargement en cours");
                                            }
                                        }}
                                        className={`h-full aspect-square rounded-xl flex flex-col items-center justify-center border transition-all active:scale-95 shadow-md px-3
                                        ${isDisabled
                                            ? 'bg-slate-950 text-slate-700 cursor-not-allowed border-slate-800 opacity-50'
                                            : `bg-gradient-to-br from-slate-700 to-slate-800 hover:from-white hover:to-slate-200 hover:text-slate-900 text-white border-white/10 group-hover:border-white/30`
                                        }`}
                                    >
                                        {isThisLoading ? (
                                            <span className="animate-spin text-xl">⏳</span>
                                        ) : (
                                            <>
                                                <span className="text-xl font-bold leading-none mb-1">+</span>
                                                <span className={`text-[9px] font-black uppercase ${hasPoints ? 'text-yellow-400 group-hover:text-slate-900' : ''}`}>
                                                    {cout} pts
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatsTab;