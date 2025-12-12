import React, { useEffect, useState } from 'react';

const LevelUpModal = ({ newLevel, onClose, allRecipes = [] }) => {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        setTimeout(() => setShowContent(true), 50);
    }, []);

    // Trouver les recettes débloquées
    const unlockedRecipes = allRecipes.filter(r => r.niveau_requis === newLevel);

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fadeIn">
            
            {/* Effet de Rayons (Lumière divine derrière) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/20 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            {/* CONTENEUR PRINCIPAL */}
            <div className={`relative w-full max-w-sm mx-4 transform transition-all duration-700 ease-out ${showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10'}`}>
                
                {/* Carte */}
                <div className="bg-slate-900 border-y-4 border-yellow-500 rounded-3xl shadow-[0_0_60px_rgba(234,179,8,0.4)] overflow-hidden relative">
                    
                    {/* Fond décoratif subtil */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-black opacity-90"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>

                    <div className="relative z-10 flex flex-col items-center p-8 text-center">
                        
                        {/* ICÔNE LEVEL UP */}
                        <div className="mb-4 relative">
                            <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-50 animate-pulse"></div>
                            <span className="text-6xl relative z-10 drop-shadow-2xl">🆙</span>
                        </div>

                        {/* TITRE */}
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 font-pirata tracking-widest mb-1 drop-shadow-sm">
                            NIVEAU {newLevel} !
                        </h2>
                        <p className="text-yellow-100/60 text-xs font-bold uppercase tracking-[0.2em] mb-8">
                            Puissance débloquée
                        </p>

                        {/* RÉCOMPENSES */}
                        <div className="w-full space-y-3 mb-8">
                            
                            {/* 1. POINTS DE STATS */}
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-yellow-500/30 p-3 rounded-xl flex items-center gap-4 shadow-lg animate-slideInRight">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500 flex items-center justify-center text-xl shrink-0">
                                    🌟
                                </div>
                                <div className="text-left">
                                    <p className="text-yellow-400 font-black text-lg leading-none">+5 Points</p>
                                    <p className="text-slate-400 text-[10px] uppercase font-bold">À distribuer dans vos stats</p>
                                </div>
                            </div>

                            {/* 2. SOIN COMPLET */}
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-green-500/30 p-3 rounded-xl flex items-center gap-4 shadow-lg animate-slideInLeft delay-100">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-xl shrink-0">
                                    ❤️
                                </div>
                                <div className="text-left">
                                    <p className="text-green-400 font-black text-lg leading-none">Restauré</p>
                                    <p className="text-slate-400 text-[10px] uppercase font-bold">Santé et Énergie au max</p>
                                </div>
                            </div>

                            {/* 3. RECETTES (Si débloquées) */}
                            {unlockedRecipes.length > 0 && (
                                <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-blue-500/30 p-3 rounded-xl flex flex-col items-start gap-2 shadow-lg animate-slideInRight delay-200">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-xl shrink-0">
                                            📜
                                        </div>
                                        <div className="text-left">
                                            <p className="text-blue-400 font-black text-lg leading-none">Savoir Ancien</p>
                                            <p className="text-slate-400 text-[10px] uppercase font-bold">{unlockedRecipes.length} recette(s) apprise(s)</p>
                                        </div>
                                    </div>
                                    {/* Liste des items débloqués */}
                                    <div className="flex flex-wrap gap-2 mt-1 pl-14">
                                        {unlockedRecipes.map((r, i) => (
                                            <span key={i} className="text-[9px] bg-black/50 border border-white/10 px-2 py-1 rounded text-slate-300">
                                                {r.nom.replace('Recette : ', '')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BOUTON */}
                        <button 
                            onClick={onClose}
                            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all transform hover:-translate-y-1 active:scale-95"
                        >
                            Continuer
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelUpModal;