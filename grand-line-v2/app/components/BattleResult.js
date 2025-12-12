import React from 'react';

const BattleResult = ({ result, onClose }) => {
    if (!result) return null;

    const isVictory = result.etat === 'VICTOIRE';
    
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fadeIn">
            <div className={`relative w-full max-w-md p-8 rounded-3xl border-4 text-center shadow-2xl overflow-hidden
                ${isVictory ? 'border-yellow-500 bg-slate-900' : 'border-red-900 bg-slate-950'}`}
            >
                {/* Titre */}
                <h2 className={`text-6xl font-black font-pirata uppercase mb-8 tracking-widest drop-shadow-lg
                    ${isVictory ? 'text-yellow-400 animate-bounce-slow' : 'text-red-600'}`}
                >
                    {isVictory ? 'VICTOIRE !' : 'DÉFAITE...'}
                </h2>

                {/* Grille des Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    
                    {/* XP */}
                    <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Expérience</span>
                        <span className="text-xl font-black text-cyan-400">
                            {isVictory ? `+${result.gain_xp}` : '0'} XP
                        </span>
                    </div>

                    {/* Berrys */}
                    <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Butin</span>
                        <span className="text-xl font-black text-yellow-400">
                            {isVictory ? `+${result.gain_berrys}` : '0'} ฿
                        </span>
                    </div>

                    {/* LP (Ranked) */}
                    <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Classement</span>
                        <span className={`text-xl font-black ${result.gain_elo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {result.gain_elo > 0 ? '+' : ''}{result.gain_elo} LP
                        </span>
                    </div>
                </div>

                {/* Bouton Continuer */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition transform hover:scale-105 active:scale-95 cursor-pointer relative z-50
                    ${isVictory ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                    Continuer l'aventure
                </button>

            </div>
        </div>
    );
};

export default BattleResult;