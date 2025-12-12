import React from 'react';
import { getStatCost } from '../utils/gameUtils'; // Import de la fonction qu'on a déplacée

const StatRow = ({ label, base, total, statCode, icon, desc, pointsDispo, onInvest, theme }) => {
    const cost = getStatCost(base);
    const canAfford = pointsDispo >= cost;
    const bonus = (total || base) - base; 

    return (
        <div className={`flex justify-between items-start border-b ${theme.borderLow} py-3 hover:bg-white/5 transition px-3`}>
            {/* GAUCHE */}
            <div className="flex flex-col max-w-[60%]">
                <div className={`flex items-center gap-2 text-lg font-bold ${theme.textMain} font-[Pirata One]`}>
                    <span>{icon}</span> {label}
                </div>
                <p className={`text-[10px] ${theme.textDim} italic leading-tight mt-0.5`}>{desc}</p>
                <p className={`text-[9px] mt-1 font-bold uppercase tracking-wider ${canAfford ? 'text-green-500' : 'text-red-500/60'}`}>
                    Coût amélioration : {cost} pts
                </p>
            </div>

            {/* DROITE */}
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-1">
                    <span className={`font-black text-2xl font-[Pirata One] text-white`}>{total || base}</span>
                    {bonus > 0 && (
                        <span className="text-xs font-bold text-green-400 animate-pulse">(+{bonus})</span>
                    )}
                </div>
                
                <button 
                    onClick={() => canAfford && onInvest(statCode)} 
                    disabled={!canAfford}
                    className={`h-7 px-3 rounded-lg text-[10px] font-black shadow-lg transition border border-white/10 flex items-center justify-center
                    ${canAfford ? theme.btnSmall : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                    UP +1
                </button>
            </div>
        </div>
    );
};

export default StatRow;