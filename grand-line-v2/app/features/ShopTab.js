import React, { useState, useEffect } from 'react';
import StatsDisplay from '../components/StatsDisplay';
import { getRareteConfig } from '../utils/gameUtils';

const ShopTab = ({ items, onBuy, theme, joueur, inventaire }) => { 
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState('TOUT');
    const [rarityFilter, setRarityFilter] = useState('TOUT');
    
    const [selectedItem, setSelectedItem] = useState(null);
    const [buyQuantity, setBuyQuantity] = useState(1);

    const availableRarities = ['TOUT', 'Commun', 'Rare', 'Épique', 'Légendaire', 'Mythique'];
    const CATEGORY_FILTERS = ['TOUT', 'ARMES', 'CHAPEAUX', 'CORPS', 'BOTTES', 'BIJOUX', 'COLLIERS', 'FRUITS', 'COFFRES', 'CONSOMMABLES', 'RESSOURCES'];

    // Liste des types considérés comme Équipement (Achat 1 par 1)
    const EQUIPMENT_TYPES = ['ARME', 'MAIN_DROITE', 'TETE', 'CORPS', 'BOTTES', 'PIEDS', 'BAGUE', 'ACCESSOIRE_1', 'COLLIER', 'ACCESSOIRE_2', 'NAVIRE'];

    // --- 1. FILTRE TUTO (Potion seulement si niveau < 3) ---
    // C'est la modification principale : on filtre la liste brute "items" en premier
    const itemsVisibles = (items || []).filter(item => {
        if (joueur && joueur.niveau >= 5) return true; // Tout voir si niveau 3+
        return item.nom === "Potion mineure"; // Sinon, juste la potion
    });

    // --- 2. FILTRAGE CLASSIQUE (Recherche / Catégorie) ---
    // On applique les filtres sur "itemsVisibles" et non plus sur "items"
    const filteredItems = itemsVisibles.filter(item => {
        if (searchTerm && !item.nom.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        
        const type = item.type_equipement;
        const cat = item.categorie;

        switch (typeFilter) {
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

        if (rarityFilter !== 'TOUT' && item.rarete !== rarityFilter) return false;
        return true;
    });
    
    const openBuyModal = (item) => {
        setSelectedItem(item);
        setBuyQuantity(1); // Reset à 1 à l'ouverture
    };

    const handleConfirmBuy = () => {
        if (selectedItem) {
            onBuy(selectedItem, buyQuantity);
            setSelectedItem(null);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-24">
            
            {/* HEADER FILTRES */}
            <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md py-2 -mx-2 px-2 border-b border-white/5 space-y-3">
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <input type="text" placeholder="🔍 Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="relative w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 pl-11 text-white text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition shadow-inner placeholder:text-slate-500"/>
                    <span className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-yellow-400 transition">🔎</span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORY_FILTERS.map(f => (
                        <button key={f} onClick={() => setTypeFilter(f)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[9px] font-bold transition uppercase border backdrop-blur-sm ${typeFilter === f ? `bg-yellow-500 text-slate-900 border-yellow-400 shadow-lg` : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>{f}</button>
                    ))}
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {availableRarities.map(r => (
                        <button key={r} onClick={() => setRarityFilter(r)} className={`flex-shrink-0 px-3 py-1 rounded-md text-[10px] font-bold transition uppercase border ${rarityFilter === r ? `bg-slate-800 border-white text-white shadow-md` : `bg-transparent border-transparent text-slate-600 hover:text-slate-400`}`}>{r}</button>
                    ))}
                </div>
            </div>

            {/* GRILLE BOUTIQUE */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredItems.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40"><span className="text-4xl mb-4 grayscale">🏪</span><p className="text-slate-300 font-pirata text-xl">Rayon vide...</p></div>
                ) : (
                    filteredItems.map((item) => {
                        const cfg = getRareteConfig(item.rarete);
                        
                        // 1. Logique Inventaire
                        const itemInventaire = inventaire ? inventaire.find(inv => Number(inv.objet_id) === Number(item.id)) : null;
                        const quantitePossedee = itemInventaire ? itemInventaire.quantite : 0;
                        const canAfford = joueur.berrys >= item.prix_achat;

                        // 2. Définition des Types
                        const isFruit = item.categorie === 'Fruit du Démon' || item.categorie === 'Fruit' || item.type_equipement === 'FRUIT' || item.type_equipement === 'FRUIT_DEMON';
                        
                        // 3. Logique RUPTURE DE STOCK
                        // SEULS les fruits sont bloqués si on en a déjà un
                        const isOutOfStock = isFruit && quantitePossedee > 0;
                        
                        // 4. Logique Bouton Grisé (Bloqué si rupture OU pas d'argent)
                        const isBlocked = !canAfford || isOutOfStock;

                        return (
                            <div key={item.id} className={`group relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all duration-300 
                                ${isOutOfStock ? 'border-slate-700 opacity-80' : `hover:shadow-2xl hover:-translate-y-1 ${cfg.border ? `hover:${cfg.border}` : ''}`}`}>
                                
                                {isOutOfStock && (
                                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 pointer-events-auto cursor-not-allowed">
                                        <div className="bg-red-600 text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] -rotate-12 border-y-2 border-red-800 shadow-2xl px-6 py-1 opacity-100 drop-shadow-lg whitespace-nowrap transform scale-110">RUPTURE</div>
                                    </div>
                                )}

                                <div className={`relative h-24 w-full bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden ${isOutOfStock ? 'grayscale opacity-40' : ''}`}>
                                    {!isOutOfStock && <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-current ${cfg.text.replace('text-', 'bg-')}`}></div>}
                                    <img src={item.image_url} alt={item.nom} className={`w-full h-full object-contain drop-shadow-xl z-10 transition-transform duration-300 ${!isOutOfStock && 'group-hover:scale-110'}`} />
                                    
                                    {/* BADGE UNIQUE (Seulement pour les fruits) */}
                                    {isFruit && (
                                        <span className="absolute top-2 left-2 z-20 bg-purple-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded animate-pulse border border-purple-400 shadow-[0_0_10px_#a855f7] flex items-center gap-1">☠️ UNIQUE</span>
                                    )}
                                </div>

                                <div className={`p-3 flex-1 flex flex-col border-t border-white/5 bg-slate-900/50 ${isOutOfStock ? 'opacity-50' : ''}`}>
                                    <div className="mb-2">
                                        <h4 className={`font-bold text-xs md:text-sm leading-tight line-clamp-1 transition ${isOutOfStock ? 'text-slate-500' : `group-hover:text-white ${cfg.text}`}`}>{item.nom}</h4>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{item.categorie} • {item.rarete}</p>
                                    </div>
                                    <div className="flex-1 min-h-[1.5rem]"><StatsDisplay stats={item.stats_bonus} compact={true} /></div>
                                </div>

                                <div className={`flex items-center justify-between bg-slate-800 border-t border-slate-700 p-2 gap-2 ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Prix</span>
                                        <span className={`font-bold text-sm ${isOutOfStock ? 'text-slate-500 line-through' : 'text-yellow-400'}`}>{item.prix_achat.toLocaleString()} ฿</span>
                                        {/* AFFICHER STOCK POUR TOUT LE MONDE SI > 0 */}
                                        {quantitePossedee > 0 && (
                                            <span className="text-[9px] text-green-400 font-bold">En stock: {quantitePossedee}</span>
                                        )}
                                    </div>
                                    <button onClick={() => !isBlocked && openBuyModal(item)} disabled={isBlocked} className={`font-black text-xs px-4 py-2 rounded-lg transition shadow-lg flex items-center gap-1 ${isBlocked ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600' : 'bg-yellow-600 hover:bg-yellow-500 text-slate-900 active:scale-95'}`}>
                                        <span>{isOutOfStock ? 'POSSÉDÉ' : 'ACHETER'}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODALE ACHAT */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn p-4">
                    <div className="bg-slate-900 border-4 border-yellow-600 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(234,179,8,0.3)] relative text-center">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white font-bold text-xl">✕</button>
                        <h3 className="text-2xl font-pirata text-yellow-500 mb-6 uppercase tracking-widest">Confirmer l'achat</h3>
                        
                        <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-xl border border-slate-700 mb-6 text-left">
                            <div className="w-14 h-14 bg-slate-900 rounded-lg border border-white/10 flex items-center justify-center shrink-0">
                                <img src={selectedItem.image_url} alt={selectedItem.nom} className="w-10 h-10 object-contain" />
                            </div>
                            <div>
                                <p className="text-white font-bold">{selectedItem.nom}</p>
                                <p className="text-yellow-500 text-xs font-mono">{selectedItem.prix_achat.toLocaleString()} ฿ / unité</p>
                            </div>
                        </div>

                        <div className="mb-6 bg-black/40 p-3 rounded-xl border border-white/5">
                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Quantité</p>
                            
                            {/* 🔥 LOGIQUE D'AFFICHAGE DU SÉLECTEUR DE QUANTITÉ */}
                            {(() => {
                                // Détections locales à la modale
                                const isFruit = selectedItem.categorie === 'Fruit du Démon' || selectedItem.categorie === 'Fruit' || selectedItem.type_equipement === 'FRUIT';
                                const isEquip = EQUIPMENT_TYPES.includes(selectedItem.type_equipement) || ['Arme', 'Tête', 'Corps', 'Pieds', 'Accessoire', 'Navire'].includes(selectedItem.categorie);
                                
                                // CAS 1 : FRUIT (Unique)
                                if (isFruit) {
                                    return (
                                        <div className="text-center py-2">
                                            <span className="text-purple-400 font-bold text-xs uppercase border border-purple-500/50 bg-purple-900/20 px-3 py-1 rounded-full">
                                                Objet Unique (Max 1)
                                            </span>
                                        </div>
                                    );
                                }
                                
                                // CAS 2 : ÉQUIPEMENT (1 par achat)
                                if (isEquip) {
                                    return (
                                        <div className="text-center py-2">
                                            <span className="text-blue-400 font-bold text-xs uppercase border border-blue-500/50 bg-blue-900/20 px-3 py-1 rounded-full">
                                                1 par achat
                                            </span>
                                        </div>
                                    );
                                }

                                // CAS 3 : CONSOMMABLE / RESSOURCE (Sélecteur classique)
                                return (
                                    <>
                                        <div className="flex items-center justify-center gap-3 mb-3">
                                            <button onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))} className="w-8 h-8 bg-slate-700 rounded hover:bg-slate-600 text-white font-bold">-</button>
                                            <input type="number" value={buyQuantity} onChange={(e) => setBuyQuantity(Math.max(1, Number(e.target.value)))} className="w-16 text-center bg-slate-950 border border-slate-600 rounded py-1 text-white font-bold"/>
                                            <button onClick={() => setBuyQuantity(buyQuantity + 1)} className="w-8 h-8 bg-slate-700 rounded hover:bg-slate-600 text-white font-bold">+</button>
                                        </div>
                                        <div className="flex justify-center gap-2 text-[10px]">
                                            <button onClick={() => setBuyQuantity(1)} className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 border border-slate-600">x1</button>
                                            <button onClick={() => setBuyQuantity(10)} className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 border border-slate-600">x10</button>
                                            <button onClick={() => setBuyQuantity(50)} className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 border border-slate-600">x50</button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="flex justify-between items-center bg-yellow-900/20 p-3 rounded-lg border border-yellow-700/30 mb-6">
                            <span className="text-slate-300 text-sm">Total à payer</span>
                            <span className="text-2xl font-black text-yellow-400 font-mono">{(selectedItem.prix_achat * buyQuantity).toLocaleString()} ฿</span>
                        </div>

                        <button onClick={handleConfirmBuy} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl shadow-lg transform active:scale-95 transition flex items-center justify-center gap-2"><span>VALIDER L'ACHAT</span> 🛒</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopTab;