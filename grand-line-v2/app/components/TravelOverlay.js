import React from 'react';

const TravelOverlay = ({ timeLeft, theme }) => {
    
    // Fonction pour transformer les millisecondes en "01m 30s"
    const formatTime = (ms) => {
        if (!ms || ms <= 0) return "ARRIVÉE...";
        
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        // Ajoute un zéro devant si < 10 (ex: 05)
        const minStr = minutes.toString().padStart(2, '0');
        const secStr = seconds.toString().padStart(2, '0');
        
        return `${minStr}m ${secStr}s`;
    };

    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-sky-900 to-blue-950 text-white animate-fadeIn">
            
            {/* --- EFFET DE FOND --- */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            
            {/* --- LE NAVIRE (ANIMÉ) --- */}
            <div className="relative z-10 mb-12">
                {/* Cercle Compas */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 border-2 border-dashed border-white/20 rounded-full"></div>

                {/* Bateau qui tangue */}
                <div className="text-9xl filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)] animate-shipRock">
                    ⛵
                </div>
            </div>

            {/* --- TEXTE & CHRONO --- */}
            <div className="relative z-10 text-center space-y-6">
                <h2 className="text-3xl font-black uppercase font-pirata tracking-[0.3em] text-blue-200 animate-pulse">
                    Traversée en cours
                </h2>
                
                {/* LE COMPTEUR */}
                <div className="inline-flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl border-2 border-white/10 px-10 py-6 rounded-2xl shadow-2xl min-w-[250px]">
                    <span className="text-6xl font-black font-mono text-yellow-400 tabular-nums tracking-widest drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                        {formatTime(timeLeft)}
                    </span>
                    <p className="text-xs text-slate-400 uppercase font-bold mt-2 tracking-wider">Temps Restant</p>
                </div>

                <p className="text-xs text-blue-300/60 italic max-w-xs mx-auto">
                    "L'horizon n'est qu'une ligne imaginaire qui recule au fur et à mesure qu'on avance."
                </p>
            </div>

            {/* --- VAGUES (BAS DE L'ÉCRAN) --- */}
            <div className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 w-[200%] h-full bg-blue-500/20 rounded-[40%] animate-wave"></div>
                <div className="absolute -bottom-4 w-[200%] h-full bg-blue-600/30 rounded-[45%] animate-wave delay-75 duration-[7s]"></div>
                <div className="absolute -bottom-8 w-[200%] h-full bg-blue-800/60 rounded-[40%] animate-wave delay-150 duration-[5s]"></div>
            </div>

            {/* Styles CSS Inline pour éviter les bugs Tailwind */}
            <style jsx>{`
                @keyframes shipRock {
                    0%, 100% { transform: rotate(-4deg) translateY(0); }
                    50% { transform: rotate(4deg) translateY(15px); }
                }
                @keyframes wave {
                    0% { transform: translateX(0) translateY(0) scaleY(1); }
                    50% { transform: translateX(-25%) translateY(10px) scaleY(0.9); }
                    100% { transform: translateX(-50%) translateY(0) scaleY(1); }
                }
                .animate-shipRock { animation: shipRock 4s ease-in-out infinite; }
                .animate-wave { animation: wave 10s linear infinite; }
            `}</style>
        </div>
    );
};

export default TravelOverlay;