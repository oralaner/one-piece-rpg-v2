import React from 'react';

// Configuration des icônes et couleurs pour chaque stat
const STAT_CONFIG = {
    force: { icon: "⚔️", color: "text-red-400", label: "Force" },
    defense: { icon: "🛡️", color: "text-blue-400", label: "Défense" },
    agilite: { icon: "🍃", color: "text-green-400", label: "Agilité" },
    vitesse: { icon: "⚡", color: "text-yellow-400", label: "Vitesse" },
    vitalite: { icon: "❤️", color: "text-pink-400", label: "Vitalité" },
    intelligence: { icon: "🧠", color: "text-cyan-400", label: "Intel." },
    sagesse: { icon: "🦉", color: "text-purple-400", label: "Sagesse" },
    chance: { icon: "🍀", color: "text-emerald-400", label: "Chance" },
    force_brute: { icon: "💪", color: "text-red-600", label: "Force Brute" },
};

const StatsDisplay = ({ stats, compact = false }) => {
    // 1. Sécurité absolue : Si stats est null, undefined ou vide, on arrête tout
    if (!stats || typeof stats !== 'object' || Object.keys(stats).length === 0) {
        return null;
    }

    const keys = Object.keys(stats);

    return (
        <div className={`flex flex-wrap ${compact ? 'gap-x-2 gap-y-0.5' : 'gap-2'}`}>
            {keys.map((key) => {
                const value = stats[key];
                const config = STAT_CONFIG[key.toLowerCase()] || { icon: "🔹", color: "text-slate-300", label: key };
                
                let displayValue = "";
                let isRange = false;

                // --- 🛡️ LOGIQUE DE RENDU SÉCURISÉE ---

                // CAS 1 : C'est une fourchette { min, max }
                if (typeof value === 'object' && value !== null) {
                    if ('min' in value && 'max' in value) {
                        displayValue = `${value.min}-${value.max}`;
                        isRange = true;
                    } else {
                        // CAS CRITIQUE : Objet inconnu ou vide -> ON L'IGNORE (évite le crash React)
                        return null; 
                    }
                } 
                // CAS 2 : C'est un nombre
                else if (typeof value === 'number') {
                    // On n'affiche pas les zéros sauf si demandé explicitement (mais ici on filtre)
                    if (value === 0) return null;
                    displayValue = value > 0 ? `+${value}` : `${value}`;
                }
                // CAS 3 : C'est une chaîne de caractères
                else if (typeof value === 'string') {
                    displayValue = value;
                }
                // CAS 4 : Autre chose (null, undefined, booléen) -> On ignore
                else {
                    return null;
                }

                return (
                    <div 
                        key={key} 
                        className={`flex items-center whitespace-nowrap ${compact ? 'text-[10px]' : 'text-xs'} font-bold bg-black/40 px-1.5 py-0.5 rounded border border-white/5`}
                    >
                        {/* Icône */}
                        <span className="mr-1 opacity-90 text-[1.1em]">{config.icon}</span>
                        
                        {/* Valeur */}
                        <span className={`${config.color} mr-1`}>
                            {displayValue}
                        </span>

                        {/* Nom de la stat (Sauf en mode compact) */}
                        {!compact && (
                            <span className="text-slate-400 uppercase tracking-wider text-[9px] ml-0.5">
                                {config.label}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StatsDisplay;