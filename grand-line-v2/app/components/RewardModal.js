import React, { useEffect, useState } from 'react';

const RewardModal = ({ result, onClose }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
    }, []);

    // Sécurisation des données
    const xp = result?.xp || 0;
    const berrys = result?.berrys || 0;
    const items = result?.items || [];
    const message = result?.message || "Action terminée";
    const title = result?.title || "Résultat";

    // Helper couleur rareté (si pas importé)
    const getRarityColor = (rarity) => {
        switch ((rarity || "").toUpperCase()) {
            case 'LÉGENDAIRE': return 'border-orange-500 bg-orange-900/20 text-orange-300';
            case 'ÉPIQUE': return 'border-purple-500 bg-purple-900/20 text-purple-300';
            case 'RARE': return 'border-blue-500 bg-blue-900/20 text-blue-300';
            case 'UNCOMMON': return 'border-green-500 bg-green-900/20 text-green-300';
            default: return 'border-slate-600 bg-slate-800 text-slate-300';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
            
            <div className={`relative bg-slate-900 border-2 border-slate-600 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 border-b border-slate-700 text-center">
                    <h3 className="text-xl font-pirata text-white tracking-widest uppercase">{title}</h3>
                </div>

                {/* Contenu */}
                <div className="p-6 flex flex-col gap-6 items-center">
                    
                    {/* Message Principal */}
                    <p className="text-center text-slate-300 text-sm leading-relaxed">
                        {message}
                    </p>

                    {/* XP & Berrys */}
                    <div className="flex gap-4 w-full justify-center">
                        {xp > 0 && (
                            <div className="flex flex-col items-center bg-blue-900/20 border border-blue-500/30 p-2 rounded-lg w-24">
                                <span className="text-2xl">✨</span>
                                <span className="font-black text-blue-400">+{xp} XP</span>
                            </div>
                        )}
                        {berrys > 0 && (
                            <div className="flex flex-col items-center bg-yellow-900/20 border border-yellow-500/30 p-2 rounded-lg w-24">
                                <span className="text-2xl">💰</span>
                                <span className="font-black text-yellow-400">+{berrys} ฿</span>
                            </div>
                        )}
                    </div>

                    {/* 🔥 LISTE DES ITEMS (LA PARTIE QUI MANQUAIT) 🔥 */}
                    {items.length > 0 && (
                        <div className="w-full animate-slideInRight">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-[1px] bg-slate-700 flex-1"></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">BUTIN RÉCUPÉRÉ</span>
                                <div className="h-[1px] bg-slate-700 flex-1"></div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2">
                                {items.map((item, index) => {
                                    const rarityStyle = getRarityColor(item.rarity || item.rarete);
                                    return (
                                        <div key={index} className={`aspect-square relative rounded-lg border ${rarityStyle} flex items-center justify-center group cursor-help transition-transform hover:scale-105`}>
                                            
                                            {/* Image */}
                                            {item.image_url ? (
                                                <img src={item.image_url} className="w-8 h-8 object-contain drop-shadow-md" alt={item.nom} />
                                            ) : (
                                                <span className="text-xl">📦</span>
                                            )}

                                            {/* Badge Quantité */}
                                            <div className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-600 shadow-sm z-10">
                                                x{item.quantite}
                                            </div>

                                            {/* Tooltip Nom au survol */}
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700 z-20">
                                                {item.nom}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Bouton Fermer */}
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition shadow-lg mt-2"
                    >
                        CONTINUER
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RewardModal;