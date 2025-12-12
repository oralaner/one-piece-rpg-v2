import React from 'react';

const ShipyardTab = ({ navire, nextNavire, onUpgrade, theme, berryCount = 0, inventaire = [] }) => {
    
    // --- 1. FONCTION DE NORMALISATION DU NOM ---
    const getShipImage = (nom) => {
        if (!nom) return "/navires/radeau.png"; 
        
        const filename = nom
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
            .replace(/ /g, "_") 
            .replace(/'/g, ""); 

        return `/navires/${filename}.png`;
    };

    // Fonction pour savoir combien on en a
    const getQtePossedee = (idItemDuCout) => {
        if (!inventaire) return 0;
        // On cherche l'item qui a cet objet_id
        const found = inventaire.find(x => x.objet_id === idItemDuCout);
        return found ? found.quantite : 0;
    };

    // Vérifie si on a TOUT (Or + Matériaux)
    const canAfford = () => {
        if (!nextNavire) return false;
        
        // Sécurisation du coût en Berrys
        const coutBerrys = Number(nextNavire.cout_berrys || 0);
        if (berryCount < coutBerrys) return false;
        
        if (nextNavire.listeMateriaux) {
            for (const mat of nextNavire.listeMateriaux) {
                if (getQtePossedee(mat.id) < mat.qte_requise) return false;
            }
        }
        return true;
    };

    // --- RENDER ---
    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            
            {/* --- 1. NAVIRE ACTUEL --- */}
            <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-[#3e2723] h-64 md:h-80 flex flex-col justify-between p-6 group">
                
                {/* IMAGE DE FOND */}
                <div className="absolute inset-0 bg-slate-900">
                    <img 
                        src={getShipImage(navire?.nom)} 
                        alt={navire?.nom || "Navire"}
                        onError={(e) => { e.currentTarget.src = "/navires/radeau.png"; }}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60"></div>
                </div>

                {/* INFO HAUT */}
                <div className="relative z-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-pirata tracking-wide">
                        {navire?.nom || "Radeau"}
                    </h2>
                    <div className="inline-block bg-yellow-500/20 border border-yellow-500/50 px-3 py-1 rounded-full mt-2 backdrop-blur-sm">
                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest">
                            Niveau {navire?.niveau || 1}
                        </p>
                    </div>
                </div>
                
                {/* INFO BAS (STATS) */}
                <div className="relative z-10 flex justify-center gap-4 md:gap-8">
                    <div className="flex flex-col items-center">
                        <div className="bg-cyan-900/60 p-2 rounded-lg border border-cyan-500/30 backdrop-blur-md min-w-[80px] text-center">
                            <span className="text-xl mb-1 block">💨</span>
                            <span className="text-cyan-300 uppercase text-[9px] font-bold block">Vitesse</span>
                            <span className="text-white font-black text-lg">x{(navire?.vitesse || 1)}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                        <div className="bg-purple-900/60 p-2 rounded-lg border border-purple-500/30 backdrop-blur-md min-w-[80px] text-center">
                            <span className="text-xl mb-1 block">🍀</span>
                            <span className="text-purple-300 uppercase text-[9px] font-bold block">Chance</span>
                            <span className="text-white font-black text-lg">+{navire?.bonus_chance || 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 2. PROJET DE CONSTRUCTION --- */}
            {nextNavire ? (
                <div className={`bg-black/30 border ${theme.borderLow} p-4 md:p-6 rounded-xl relative overflow-hidden`}>
                    <div className="text-center mb-6">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Amélioration disponible</p>
                        <h3 className={`text-xl font-black uppercase ${theme.textMain}`}>
                            {nextNavire.nom_type || nextNavire.nom} (Niv {nextNavire.niveau})
                        </h3>
                    </div>

                    {/* LISTE DES COÛTS */}
                    <div className="space-y-3 mb-6">
                        
                        {/* 1. Or (Sécurisé) */}
                        <div className={`flex items-center justify-between p-3 rounded-xl border bg-black/40 ${berryCount >= Number(nextNavire.cout_berrys) ? 'border-green-500/30' : 'border-red-500/30'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-xl">💰</div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase">Berrys requis</p>
                                    <p className="text-[10px] text-slate-400">Trésorerie : {Number(berryCount).toLocaleString()}</p>
                                </div>
                            </div>
                            <p className={`font-mono font-black ${berryCount >= Number(nextNavire.cout_berrys) ? 'text-green-400' : 'text-red-400'}`}>
                                {Number(nextNavire.cout_berrys || 0).toLocaleString()} ฿
                            </p>
                        </div>

                        {/* 2. Matériaux (Grille) */}
                        {nextNavire.listeMateriaux && nextNavire.listeMateriaux.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {nextNavire.listeMateriaux.map((mat, i) => {
                                    const possede = getQtePossedee(mat.id);
                                    const requis = mat.qte_requise;
                                    const isOk = possede >= requis;
                                    const percentage = Math.min(100, (possede / requis) * 100);

                                    return (
                                        <div key={i} className={`relative flex items-center justify-between p-2 pr-3 rounded-xl border bg-black/40 overflow-hidden ${isOk ? 'border-green-500/30' : 'border-red-500/30'}`}>
                                            
                                            {/* Barre de progression en fond */}
                                            <div 
                                                className={`absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-500 ${isOk ? 'bg-green-500' : 'bg-yellow-500'}`} 
                                                style={{ width: `${percentage}%` }}
                                            ></div>

                                            <div className="relative z-10 flex items-center gap-3 w-full">
                                                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
                                                    {mat.image_url ? (
                                                        <img src={mat.image_url} alt={mat.nom} className="w-full h-full object-contain"/>
                                                    ) : (
                                                        <span>🪵</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-xs font-bold truncate ${isOk ? 'text-white' : 'text-slate-300'}`}>{mat.nom}</p>
                                                    <p className={`text-[10px] font-mono font-black ${isOk ? 'text-green-400' : 'text-red-400'}`}>
                                                        {possede} / {requis}
                                                    </p>
                                                </div>
                                                {isOk && <span className="text-green-400 font-bold text-lg">✓</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* BOUTON ACTION */}
                    <button 
                        onClick={onUpgrade} 
                        disabled={!canAfford()}
                        className={`w-full py-4 rounded-xl font-black uppercase shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2
                        ${canAfford() ? theme.btnPrimary : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
                    >
                        {canAfford() ? "LANCER LA CONSTRUCTION 🔨" : "RESSOURCES INSUFFISANTES"}
                    </button>

                </div>
            ) : (
                <div className="text-center py-10 bg-black/20 rounded-xl border border-yellow-500/30 animate-pulse">
                    <p className="text-4xl mb-2">👑</p>
                    <p className="text-yellow-400 font-bold uppercase tracking-widest">Niveau Maximum Atteint !</p>
                    <p className="text-xs text-slate-500 mt-2">Votre navire est une légende des mers.</p>
                </div>
            )}
        </div>
    );
};

export default ShipyardTab;