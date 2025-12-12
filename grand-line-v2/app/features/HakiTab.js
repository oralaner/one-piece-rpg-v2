import React from 'react';

const HakiTab = ({ joueur, onTrain, theme }) => {
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className={`p-6 rounded-xl text-center border-b-4 shadow-lg ${theme.btnPrimary}`}>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase drop-shadow-md">Maîtrise du Haki</h2>
                <p className="text-xs md:text-sm opacity-90 mt-1 font-medium">Éveillez votre potentiel latent.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* OBSERVATION */}
                <div className={`p-4 rounded-xl border-2 relative overflow-hidden transition-all hover:scale-[1.01] ${joueur.haki_observation ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700 bg-black/40'}`}>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className={`text-xl font-black uppercase ${joueur.haki_observation ? 'text-cyan-400' : 'text-slate-400'}`}>Kenbunshoku</h3>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Haki de l'Observation</p>
                            <p className="text-xs mt-2 text-slate-300"><span className="text-cyan-400 font-bold">Effet :</span> Voir les PV exacts + Bonus Esquive</p>
                        </div>
                        {joueur.haki_observation ? <span className="text-4xl">👁️</span> : (
                            <button onClick={() => onTrain('OBSERVATION')} className="bg-slate-800 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-bold text-xs border border-slate-600 shadow-lg transition">
                                ÉVEILLER<br/><span className="text-yellow-500">20k ฿</span> • Niv 20
                            </button>
                        )}
                    </div>
                </div>

                {/* ARMEMENT */}
                <div className={`p-4 rounded-xl border-2 relative overflow-hidden transition-all hover:scale-[1.01] ${joueur.haki_armement ? 'border-purple-500 bg-purple-900/20' : 'border-slate-700 bg-black/40'}`}>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className={`text-xl font-black uppercase ${joueur.haki_armement ? 'text-purple-400' : 'text-slate-400'}`}>Busoshoku</h3>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Haki de l'Armement</p>
                            <p className="text-xs mt-2 text-slate-300"><span className="text-purple-400 font-bold">Effet :</span> Bonus Dégâts & Défense + Touche les Logias</p>
                        </div>
                        {joueur.haki_armement ? <span className="text-4xl">🛡️</span> : (
                            <button onClick={() => onTrain('ARMEMENT')} className="bg-slate-800 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-xs border border-slate-600 shadow-lg transition">
                                ÉVEILLER<br/><span className="text-yellow-500">50k ฿</span> • Niv 40
                            </button>
                        )}
                    </div>
                </div>

                {/* ROIS */}
                <div className={`p-4 rounded-xl border-2 relative overflow-hidden transition-all hover:scale-[1.01] ${joueur.haki_rois ? 'border-red-500 bg-red-900/20' : 'border-slate-700 bg-black/40'}`}>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className={`text-xl font-black uppercase ${joueur.haki_rois ? 'text-red-500' : 'text-slate-400'}`}>Haoshoku</h3>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Haki des Rois</p>
                            <p className="text-xs mt-2 text-slate-300"><span className="text-red-400 font-bold">Effet :</span> Chance d'étourdir l'ennemi</p>
                        </div>
                        {joueur.haki_rois ? <span className="text-4xl">👑</span> : (
                            <button onClick={() => onTrain('ROIS')} className="bg-slate-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-xs border border-slate-600 shadow-lg transition">
                                ÉVEILLER<br/><span className="text-yellow-500">1M ฿</span> • Niv 80
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HakiTab;