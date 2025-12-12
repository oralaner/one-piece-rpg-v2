import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { getRareteConfig } from '../utils/gameUtils'; 
// 👇 Importation du composant sécurisé pour l'affichage des stats
import StatsDisplay from './StatsDisplay'; 

const EquipSlot = ({ type, item, onUnequip, theme }) => {
    const objetInfo = item?.objets;
    const rarity = objetInfo?.rarete
    const [tooltipData, setTooltipData] = useState(null); // { x, y }
    const [mounted, setMounted] = useState(false);
    
    // Récupération des classes de rareté (border, text, bg...)
    const rarityClasses = getRareteConfig(rarity);

    // Nécessaire pour Next.js (évite les erreurs d'hydratation avec le Portal)
    useEffect(() => {
        setMounted(true);
    }, []);

    // 1. Extraction des données
    const imageUrl = objetInfo?.image_url || item?.image_url;
    
    // 🔥 SÉCURITÉ STATS : On prépare les stats pour StatsDisplay
    // Priorité : stats_perso (Item Unique/Crafté) > stats_bonus (Item Générique)
    const statsToShow = (item?.stats_perso && Object.keys(item.stats_perso).length > 0) 
        ? item.stats_perso 
        : objetInfo?.stats_bonus;

    // GESTION DU SURVOL
    const handleMouseEnter = (e) => {
        if (!item) return;
        const rect = e.currentTarget.getBoundingClientRect();
        
        // On place le tooltip un peu à droite et aligné en haut
        setTooltipData({ 
            x: rect.right + 15, 
            y: rect.top + window.scrollY // Ajout du scroll pour être sûr
        });
    };

    const handleMouseLeave = () => {
        setTooltipData(null);
    };

    // LE TOOLTIP (RENDU VIA PORTAL)
    const TooltipContent = () => {
        if (!tooltipData || !item) return null;

        return (
            <div 
                className="fixed z-[9999] w-56 bg-slate-950/95 backdrop-blur-xl border-2 border-slate-500 rounded-xl shadow-[0_0_50px_rgba(0,0,0,1)] p-4 animate-fadeIn pointer-events-none"
                style={{ 
                    top: tooltipData.y, 
                    left: tooltipData.x 
                }}
            >
                {/* Header */}
                <div className="border-b border-white/10 pb-2 mb-2">
                    <p className={`font-black text-sm uppercase ${rarityClasses?.text || 'text-white'}`}>
                        {objetInfo?.nom}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] text-slate-400 italic">{rarity} • {type}</p>
                        {item.nom_set && <span className="text-[9px] bg-yellow-900/40 text-yellow-500 px-1.5 rounded border border-yellow-700/50">Set {item.nom_set}</span>}
                    </div>
                </div>

                {/* Stats (Utilisation de StatsDisplay pour éviter le crash) */}
                <div className="mt-2">
                    {/* ✅ ICI : Le composant sécurisé gère l'objet {min, max} sans planter */}
                    <StatsDisplay stats={statsToShow} compact={true} />
                </div>

                {/* Description */}
                {objetInfo?.description && (
                    <div className="mt-3 pt-2 border-t border-white/10">
                        <p className="text-[10px] text-slate-400 italic leading-tight">
                            "{objetInfo.description}"
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div 
                className="relative group flex flex-col items-center"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                
                {/* LE SLOT */}
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 flex items-center justify-center bg-black/40 relative transition-all duration-300 
                    ${item ? rarityClasses.border : 'border-white/10 border-dashed'}`} 
                >
                    {item ? (
                        <img 
                            src={imageUrl} 
                            alt={type} 
                            className="w-full h-full object-contain p-1" 
                        />
                    ) : (
                        <span className="text-2xl opacity-20 grayscale select-none pointer-events-none">
                            {type === 'Arme' && '⚔️'}
                            {type === 'Tête' && '🧢'}
                            {type === 'Corps' && '👕'}
                            {type === 'Bottes' && '👢'}
                            {type === 'Bague' && '💍'}
                            {type === 'Collier' && '📿'}
                            {type === 'Navire' && '⛵'}
                        </span>
                    )}
                </div>

                {/* LABEL DU TYPE */}
                <div className="text-center mt-1">
                    <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">
                        {type}
                    </span>
                </div>

                {/* BOUTON X (Déséquiper) */}
                {item && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setTooltipData(null);
                            onUnequip(type); // On passe le type (ex: 'Arme') comme slot
                        }}
                        className="absolute -top-2 -right-2 z-30 w-5 h-5 flex items-center justify-center bg-red-600 text-white rounded-full text-[10px] font-bold shadow-md border border-red-400 hover:bg-red-500 hover:scale-110 transition-transform cursor-pointer"
                        title="Retirer"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* RENDU DU TOOLTIP HORS DU FLUX (DANS LE BODY) */}
            {mounted && tooltipData && createPortal(<TooltipContent />, document.body)}
        </>
    );
};

export default EquipSlot;