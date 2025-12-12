import React, { useState } from 'react';
import StatsDisplay from '../components/StatsDisplay';
import { getRareteConfig } from '../utils/gameUtils';

const InventoryTab = ({ inventaire, joueur, onUse, onEquip, onSell, theme, ouvrirModaleVente }) => {
    
    const [searchTerm, setSearchTerm] = useState("");
    const [invFilter, setInvFilter] = useState('TOUT');
    const [rarityFilter, setRarityFilter] = useState('TOUT');

    if (!joueur) {
        return <div className="flex h-64 items-center justify-center text-slate-400 animate-pulse font-pirata text-xl">Chargement du sac...</div>;
    }

    const availableRarities = ['TOUT', 'Commun', 'Rare', 'Épique', 'Légendaire', 'Mythique'];
    const CATEGORY_FILTERS = ['TOUT', 'ARMES', 'CHAPEAUX', 'CORPS', 'BOTTES', 'BIJOUX', 'COLLIERS', 'FRUITS', 'COFFRES', 'CONSOMMABLES', 'RESSOURCES'];

    // --- FILTRAGE ---
    const filteredItems = inventaire.filter(item => {
        if (!item.objets) return false;
        if (searchTerm && !item.objets.nom.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (item.est_equipe) return false;

        const type = item.objets.type_equipement;
        const cat = item.objets.categorie;

        switch (invFilter) {
            case 'TOUT': break;
            case 'ARMES': if (!['MAIN_DROITE', 'Arme'].includes(type)) return false; break;
            case 'CHAPEAUX': if (!['TETE', 'Tête', 'Casque', 'Chapeau'].includes(type)) return false; break;
            case 'CORPS': if (!['CORPS', 'Corps', 'Tenue', 'Armure'].includes(type)) return false; break;
            case 'BOTTES': if (!['PIEDS', 'Bottes', 'Jambières'].includes(type)) return false; break;
            case 'BIJOUX': if (!['ACCESSOIRE_1', 'Bague', 'Anneau'].includes(type)) return false; break;
            case 'COLLIERS': if (!['ACCESSOIRE_2', 'Collier', 'Amulette'].includes(type)) return false; break;
            case 'FRUITS': if (!['Fruit du Démon', 'Fruit'].includes(cat)) return false; break;
            case 'COFFRES': if (cat !== 'Coffre') return false; break;
            case 'CONSOMMABLES': if (!['Consommable', 'Potion', 'Nourriture'].includes(cat)) return false; break;
            case 'RESSOURCES': if (cat !== 'Ressource') return false; break;
            default: break;
        }
        
        const rarity = item.objets.rarete;
        if (rarityFilter !== 'TOUT' && rarity !== rarityFilter) return false;
        return true;
    });

    return (
        <div className="space-y-6 animate-fadeIn pb-24">
            
            {/* HEADER FILTRES */}
            <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md py-2 -mx-2 px-2 border-b border-white/5 space-y-3">
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <input type="text" placeholder="🔍 Rechercher un objet..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="relative w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 pl-11 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition shadow-inner placeholder:text-slate-500" />
                    <span className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-400 transition">🔎</span>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORY_FILTERS.map(f => (
                        <button key={f} onClick={() => setInvFilter(f)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold transition uppercase tracking-wider border backdrop-blur-sm ${invFilter === f ? `bg-white text-slate-900 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]` : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>{f}</button>
                    ))}
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {availableRarities.map(r => (
                        <button key={r} onClick={() => setRarityFilter(r)} className={`flex-shrink-0 px-3 py-1 rounded-md text-[10px] font-bold transition uppercase border ${rarityFilter === r ? `bg-slate-800 border-white text-white shadow-md` : `bg-transparent border-transparent text-slate-600 hover:text-slate-400`}`}>{r.toUpperCase()}</button>
                    ))}
                </div>
            </div>

            {/* GRILLE */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredItems.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40"><span className="text-6xl mb-4 grayscale">🎒</span><p className="text-slate-300 font-pirata text-xl">Sac vide...</p><p className="text-slate-500 text-sm">Aucun objet dans cette catégorie.</p></div>
                ) : (
                    filteredItems.map((item) => {
                        const cfg = getRareteConfig(item.objets.rarete);
                        
                        const isCoffre = item.objets.categorie === "Coffre";
                        // 🔥 DETECTION FRUIT (via item.objets dans l'inventaire)
                        const isFruit = item.objets.categorie === 'Fruit du Démon' || item.objets.categorie === 'Fruit';
                        const isConsommable = ['Consommable', 'Potion', 'Nourriture'].includes(item.objets.categorie);
                        const isEquipable = ['Arme', 'Tête', 'Corps', 'Bottes', 'Bague', 'Collier', 'Navire', 'MAIN_DROITE', 'TETE', 'CORPS', 'PIEDS', 'ACCESSOIRE_1', 'ACCESSOIRE_2', 'NAVIRE'].includes(item.objets.type_equipement);

                        const statsToShow = (item.stats_perso && Object.keys(item.stats_perso).length > 0) ? item.stats_perso : item.objets.stats_bonus;

                        return (
                            <div key={item.id} className={`group relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${cfg.border ? `hover:${cfg.border}` : ''}`}>
                                
                                {/* HEADER IMAGE */}
                                <div className={`relative h-24 w-full bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden`}>
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-current ${cfg.text.replace('text-', 'bg-')}`}></div>
                                    
                                    {item.objets.image_url ? (
                                        <img src={item.objets.image_url} alt={item.objets.nom} className="w-full h-full object-contain drop-shadow-xl z-10 transition-transform duration-300 group-hover:scale-110" />
                                    ) : <span className="text-4xl z-10">📦</span>}

                                    <span className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 z-20">x{item.quantite}</span>
                                    <span className="absolute bottom-1 left-2 text-[10px] font-bold text-yellow-500 bg-black/40 px-1.5 rounded z-20">{Math.floor(item.objets.prix_achat / 2)} ฿</span>

                                    {/* 🔥 ICONE UNIQUE FRUIT QUI CLIGNOTE */}
                                    {isFruit && (
                                        <span className="absolute top-2 left-2 z-20 bg-purple-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded animate-pulse border border-purple-400 shadow-[0_0_10px_#a855f7] flex items-center gap-1">
                                            ☠️ UNIQUE
                                        </span>
                                    )}
                                </div>

                                {/* BODY */}
                                <div className="p-3 flex-1 flex flex-col border-t border-white/5 bg-slate-900/50">
                                    <div className="mb-2">
                                        <h4 className={`font-bold text-xs md:text-sm leading-tight line-clamp-1 group-hover:text-white transition ${cfg.text}`}>{item.objets.nom}</h4>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{item.objets.categorie}</p>
                                    </div>
                                    <div className="flex-1 min-h-[1.5rem]">
                                        <div className="scale-90 origin-top-left opacity-80">
                                            <StatsDisplay stats={statsToShow} compact={true} />
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER ACTIONS */}
                                <div className="grid grid-cols-2 gap-px bg-slate-800 border-t border-slate-800">
                                    {(isEquipable || isConsommable || isCoffre || isFruit) ? (
                                        <button onClick={() => isEquipable ? onEquip(item) : onUse(item)} className="bg-slate-900 hover:bg-slate-800 text-xs py-2.5 flex items-center justify-center gap-1 transition text-slate-300 hover:text-white" title={isEquipable ? "Équiper" : "Utiliser"}>
                                            <span>{isEquipable ? '🛡️' : (isCoffre ? '🗝️' : '✨')}</span>
                                            <span className="font-bold uppercase text-[9px]">{isEquipable ? 'Équiper' : 'Utiliser'}</span>
                                        </button>
                                    ) : (<div className="bg-slate-900/50"></div>)}

                                    <div className="flex">
                                        <button onClick={() => onSell(item, 'HDV')} className="flex-1 bg-slate-900 hover:bg-indigo-900/50 text-[10px] py-2 flex items-center justify-center border-l border-slate-800 transition text-slate-400 hover:text-indigo-300" title="Vendre au Marché">⚖️ HDV</button>
                                        <button onClick={() => ouvrirModaleVente(item)} className="flex-1 bg-slate-900 hover:bg-yellow-900/30 text-[10px] py-2 flex items-center justify-center border-l border-slate-800 transition text-slate-400 hover:text-yellow-400" title="Vente Rapide">💰 Vendre</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default InventoryTab;