import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const EnergyBar = ({ current, max, lastUpdate }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        // Si on est déjà au max, pas de timer
        if (current >= max) {
            setTimeLeft(null);
            return;
        }

        const interval = setInterval(() => {
            const now = new Date();
            const last = new Date(lastUpdate);
            const nextTick = new Date(last.getTime() + 10 * 60 * 1000); // +10 minutes
            
            const diff = nextTick - now;

            if (diff <= 0) {
                // Le temps est écoulé, le backend mettra à jour au prochain refresh
                // En attendant, on affiche 00:00
                setTimeLeft("Wait..."); 
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [current, max, lastUpdate]);

    const percent = Math.min(100, (current / max) * 100);

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-0.5">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Zap size={10} className="text-yellow-400 fill-yellow-400" /> 
                    ÉNERGIE
                </span>
                <div className="flex items-center gap-2">
                    {timeLeft && (
                        <span className="text-[9px] font-mono text-slate-500 animate-pulse">
                            +{timeLeft}
                        </span>
                    )}
                    <span className="text-[10px] font-black text-yellow-400">
                        {current} / {max}
                    </span>
                </div>
            </div>
            
            {/* Barre de progression */}
            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                    className="h-full bg-gradient-to-r from-yellow-600 to-amber-400 transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.3)]" 
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
        </div>
    );
};

export default EnergyBar;