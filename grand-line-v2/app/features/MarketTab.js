import React, { useState } from 'react';
import StatsDisplay from '../components/StatsDisplay';
import { getRareteConfig } from '../utils/gameUtils';

const MarketTab = ({ items, onBuy, theme, userId }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [hdvFilter, setHdvFilter] = useState('TOUT');

    const filteredItems = items.filter(annonce => {
        if (searchTerm && !annonce.objets.nom.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        const type = annonce.objets.type_equipement;
        if (hdvFilter === 'TOUT') return true;
        if (hdvFilter === 'EQUIPEMENT') return ['Arme', 'Tête', 'Corps', 'Bottes', 'Bague', 'Collier', 'Navire'].includes(type);
        if (hdvFilter === 'CONSOMMABLE') return ['Consommable', 'Fruit'].includes(type);
        if (hdvFilter === 'AUTRE') return !['Arme', 'Tête', 'Corps', 'Bottes', 'Bague', 'Collier', 'Navire', 'Consommable', 'Fruit'].includes(type);
        return true;
    });

    return (
        <div className="space-y-4 animate-fadeIn">
            <div className={`p-4 rounded-xl shadow-lg border-b-4 text-center ${theme.btnPrimary}`}>
                <h2 className="text-xl font-black uppercase tracking-widest text-white">Hôtel des Ventes</h2>
                <p className="text-xs opacity-90">Les meilleures affaires des pirates.</p>
            </div>

            {/* Recherche & Filtres */}
            <div className="relative">
                <input 
                    type="text" placeholder="🔍 Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-600 rounded-lg py-3 px-4 pl-10 text-white focus:border-yellow-400 outline-none"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['TOUT', 'EQUIPEMENT', 'CONSOMMABLE', 'AUTRE'].map(f => (
                    <button key={f} onClick={() => setHdvFilter(f)} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-bold uppercase ${hdvFilter === f ? theme.btnPrimary : 'bg-slate-800 text-slate-400'}`}>{f}</button>
                ))}
            </div>

            {/* Liste */}
            <div className="space-y-2">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-10 opacity-50 italic">Aucune offre...</div>
                ) : (
                    filteredItems.map((annonce, i) => {
                        const isMine = annonce.vendeur_id === userId;
                        const cfg = getRareteConfig(annonce.objets.rarete);
                        
                        return (
                            <div key={i} className={`flex flex-col md:flex-row justify-between items-start bg-black/20 p-3 rounded-xl border-l-4 transition hover:bg-black/30 ${cfg.border} mb-2`}>
                                <div className="flex-1 w-full flex gap-3">
                                    <div className="w-16 h-16 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 p-1">
                                        {annonce.objets.image_url ? <img src={annonce.objets.image_url} className="w-full h-full object-contain" /> : <span className="text-2xl">📦</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold text-sm ${theme.textMain}`}>{annonce.objets.nom}</p>
                                            <span className={`text-[9px] px-1.5 rounded font-bold uppercase ${cfg.text}`}>{annonce.objets.rarete}</span>
                                        </div>
                                        <div className="my-1 text-[10px]"><StatsDisplay stats={annonce.stats_perso || annonce.objets.stats_bonus} compact={false} /></div>
                                        <div className="flex items-center gap-2 text-xs mt-1">
                                            <span className="bg-black/40 px-2 py-0.5 rounded text-slate-300 font-mono">x{annonce.quantite}</span>
                                            <span className="text-slate-500">vendu par</span>
                                            <span className={`font-bold ${isMine ? "text-purple-400" : "text-white"}`}>{isMine ? "VOUS" : annonce.joueurs?.pseudo}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full md:w-auto mt-3 md:mt-0 gap-4">
                                    <span className="font-mono font-black text-lg text-yellow-400">{annonce.prix_unitaire.toLocaleString()} ฿</span>
                                    {isMine ? (
                                        <span className="text-[10px] font-bold text-purple-300 bg-purple-900/20 px-2 py-1 rounded border border-purple-500/30">EN VENTE</span>
                                    ) : (
                                        <button onClick={() => onBuy(annonce)} className={`font-bold py-1.5 px-4 rounded-lg shadow-lg text-xs ${theme.btnPrimary}`}>ACHETER</button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default MarketTab;