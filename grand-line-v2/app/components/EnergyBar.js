import React, { useState, useEffect } from 'react';

const EnergyBar = ({ current = 0, max = 10, lastUpdate }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    // Temps de recharge (1 heure en ms)
    // Assurez-vous que c'est la même valeur que côté Backend !
    const REGEN_DELAY = 60 * 60 * 1000; 

    useEffect(() => {
        // 1. Si l'énergie est pleine, on cache le chrono
        if (current >= max) {
            setTimeLeft(null); 
            return;
        }
        
        // 2. Si pas de date de dernière update, on ne peut pas calculer
        if (!lastUpdate) {
            setTimeLeft("--:--");
            return;
        }
        
        const calculateTime = () => {
            const lastTime = new Date(lastUpdate).getTime();
            const targetTime = lastTime + REGEN_DELAY;
            const now = new Date().getTime();
            const diff = targetTime - now;

            if (diff <= 0) {
                // Le temps est écoulé mais le front n'a pas encore reçu la nouvelle énergie
                setTimeLeft("Prêt");
            } else {
                // Conversion propre
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
        };

        // Calcul immédiat
        calculateTime();

        // Mise à jour chaque seconde
        const timer = setInterval(calculateTime, 1000);

        return () => clearInterval(timer);
    }, [current, max, lastUpdate]);

    // Calcul pourcentage barre
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));

    return (
        <div className="flex flex-col items-end w-48 relative z-20">
            {/* Barre visuelle */}
            <div className="relative w-full h-5 bg-slate-900/90 rounded-full border border-slate-600 overflow-hidden shadow-inner">
                {/* Jauge remplie */}
                <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 ease-out shadow-[0_0_15px_#06b6d4]"
                    style={{ width: `${percentage}%` }}
                ></div>
                
                {/* Texte superposé (ex: 5/10) */}
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] z-10 tracking-widest">
                    {current} / {max} ⚡
                </div>
            </div>

            {/* --- LE CHRONO EST ICI --- */}
            {/* Il ne s'affiche que si timeLeft existe (donc énergie < max) */}
            {timeLeft && (
                <div className="text-[10px] text-cyan-300 font-mono mt-1 bg-black/40 px-2 py-0.5 rounded border border-cyan-900/30 flex items-center gap-1 animate-pulse">
                    <span>⏳</span> +1 dans {timeLeft}
                </div>
            )}
        </div>
    );
};

export default EnergyBar;