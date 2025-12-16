import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Navigation, Map as MapIcon, Swords, ShoppingBag, Beer, Hammer, Skull } from 'lucide-react';

const NavigationMap = () => {
    const [loading, setLoading] = useState(true);
    const [mapData, setMapData] = useState(null);
    const [selectedIsland, setSelectedIsland] = useState(null);
    const [travelTimer, setTravelTimer] = useState(null);

    // Récupération des données initiales
    const fetchMap = async () => {
        try {
            const data = await api.get('/game/map');
            setMapData(data);
            setLoading(false);
        } catch (e) {
            console.error("Erreur chargement map", e);
        }
    };

    // Polling pour vérifier l'arrivée (si en mer)
    useEffect(() => {
        fetchMap();
        const interval = setInterval(async () => {
            if (mapData?.travelStatus?.state === 'EN_MER') {
                const status = await api.get('/game/map/status');
                if (status.status === 'ARRIVED') {
                    // Arrivée ! On rafraichit tout
                    fetchMap();
                    alert(status.message); // Tu pourras remplacer par un Toast plus joli
                }
            }
        }, 5000); // Vérifie toutes les 5 sec

        return () => clearInterval(interval);
    }, [mapData?.travelStatus?.state]);

    // Timer local pour la fluidité visuelle
    useEffect(() => {
        if (mapData?.travelStatus?.state === 'EN_MER' && mapData?.travelStatus?.arrivalTime) {
            const interval = setInterval(() => {
                const now = new Date();
                const end = new Date(mapData.travelStatus.arrivalTime);
                const diff = Math.max(0, Math.floor((end - now) / 1000));
                setTravelTimer(diff);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [mapData]);

    const handleTravel = async () => {
        if (!selectedIsland) return;
        try {
            const res = await api.post('/game/map/travel', { destinationId: selectedIsland.id });
            if (res.success) {
                fetchMap(); // On met à jour l'état immédiatement
                setSelectedIsland(null); // On ferme la modale
            }
        } catch (e) {
            alert(e.response?.data?.message || "Impossible de partir.");
        }
    };

    // --- RENDERERS ---

    // Helper pour les icônes d'infrastructures
    const getFacilityIcon = (type) => {
        switch(type) {
            case 'PORT': return <Anchor size={14} className="text-blue-400" />;
            case 'SHOP': return <ShoppingBag size={14} className="text-yellow-400" />;
            case 'ARENE': return <Swords size={14} className="text-red-400" />;
            case 'TAVERNE': return <Beer size={14} className="text-orange-400" />;
            case 'FORGE': return <Hammer size={14} className="text-gray-400" />;
            case 'QG_MARINE': return <img src="/icons/marine.png" className="w-4 h-4" alt="Marine" />; // Si tu as l'image
            default: return null;
        }
    };

    // Helper couleur selon type d'île
    const getIslandColor = (type) => {
        switch(type) {
            case 'VILLE': return 'bg-blue-500 shadow-blue-500/50';
            case 'SAUVAGE': return 'bg-green-600 shadow-green-600/50';
            case 'DONJON': return 'bg-purple-600 shadow-purple-600/50';
            case 'QG_MARINE': return 'bg-white text-blue-900 border-2 border-blue-600';
            case 'EVENT': return 'bg-yellow-500 animate-pulse';
            default: return 'bg-gray-500';
        }
    };

    if (loading || !mapData) return <div className="text-center p-10 text-white animate-pulse">Chargement de la Carte...</div>;

    const { currentLocation, travelStatus, map: islands } = mapData;
    const isSailing = travelStatus.state === 'EN_MER';

    return (
        <div className="relative w-full max-w-4xl mx-auto bg-blue-950/80 rounded-xl border border-blue-500/30 overflow-hidden shadow-2xl backdrop-blur-md">
            
            {/* 🌊 CARTE (BACKGROUND) */}
            <div className="relative w-full h-[600px] bg-[url('https://wallpaperaccess.com/full/1539250.jpg')] bg-cover bg-center opacity-90">
                
                {/* Grille Océanique (Déco) */}
                <div className="absolute inset-0 bg-blue-900/40" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                {/* 📍 LES ÎLES */}
                {islands.map((island) => {
                    const isCurrent = currentLocation?.id === island.id;
                    const isTarget = travelStatus.destinationId === island.id;
                    const isSelectable = !isSailing && !isCurrent;

                    return (
                        <motion.button
                            key={island.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.2 }}
                            onClick={() => isSelectable && setSelectedIsland(island)}
                            className={`absolute w-4 h-4 rounded-full -ml-2 -mt-2 z-10 transition-all duration-300
                                ${getIslandColor(island.type)}
                                ${isCurrent ? 'ring-4 ring-white/50 scale-125 z-20' : ''}
                                ${isTarget ? 'ring-4 ring-yellow-400/50 animate-pulse z-20' : ''}
                                ${!isSelectable && !isCurrent && !isTarget ? 'opacity-50 cursor-default' : 'cursor-pointer shadow-[0_0_15px_currentColor]'}
                            `}
                            style={{ left: `${island.pos_x / 3}%`, top: `${island.pos_y}%` }} // Division par 3 car ton X va jusqu'à 300 dans le seed
                        >
                            {/* Label au survol */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                {island.nom}
                            </div>
                        </motion.button>
                    );
                })}

                {/* 🚢 TRAJET EN COURS (LIGNE) */}
                {isSailing && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {(() => {
                            const start = islands.find(i => i.id === travelStatus.departId);
                            const end = islands.find(i => i.id === travelStatus.destinationId);
                            if (start && end) {
                                return (
                                    <line 
                                        x1={`${start.pos_x / 3}%`} y1={`${start.pos_y}%`} 
                                        x2={`${end.pos_x / 3}%`} y2={`${end.pos_y}%`} 
                                        stroke="white" strokeWidth="2" strokeDasharray="5,5" 
                                        className="animate-dash"
                                    />
                                );
                            }
                        })()}
                    </svg>
                )}
            </div>

            {/* 🕹️ HUD NAVIGATION (En Bas) */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 p-4">
                {isSailing ? (
                    // --- MODE EN MER ---
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-full animate-bounce">
                                <Navigation className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">En pleine mer...</h3>
                                <p className="text-blue-300 text-sm">Cap sur l'aventure !</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-mono text-yellow-400">{new Date(travelTimer * 1000).toISOString().substr(11, 8)}</span>
                            <div className="text-xs text-gray-400">Temps estimé</div>
                        </div>
                    </div>
                ) : (
                    // --- MODE À QUAI ---
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Anchor className="text-green-400" size={24} />
                            <div>
                                <h3 className="text-white font-bold">Actuellement à : <span className="text-green-400">{currentLocation?.nom || "Inconnu"}</span></h3>
                                <div className="flex gap-2 mt-1">
                                    {currentLocation?.facilities?.map((fac, i) => (
                                        <div key={i} title={fac} className="bg-white/10 p-1 rounded hover:bg-white/20 transition">
                                            {getFacilityIcon(fac)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                            Sélectionnez une île pour voyager
                        </div>
                    </div>
                )}
            </div>

            {/* 🛑 MODALE DÉTAILS ÎLE (Avant Voyage) */}
            <AnimatePresence>
                {selectedIsland && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute bottom-24 left-1/2 -translate-x-1/2 w-80 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl p-4 z-50"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-white">{selectedIsland.nom}</h3>
                            <button onClick={() => setSelectedIsland(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-4 italic">{selectedIsland.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                            <div className="bg-black/40 p-2 rounded">
                                <span className="text-gray-500 block">Niveau Recommandé</span>
                                <span className={`font-bold ${selectedIsland.niveau_requis > 100 ? 'text-red-400' : 'text-green-400'}`}>
                                    Niv. {selectedIsland.niveau_requis}
                                </span>
                            </div>
                            <div className="bg-black/40 p-2 rounded">
                                <span className="text-gray-500 block">Type</span>
                                <span className="text-white font-bold">{selectedIsland.type}</span>
                            </div>
                        </div>

                        {/* Liste des infras */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedIsland.facilities.map((fac) => (
                                <span key={fac} className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-300 border border-white/10 flex items-center gap-1">
                                    {getFacilityIcon(fac)} {fac}
                                </span>
                            ))}
                        </div>

                        <button 
                            onClick={handleTravel}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            <Navigation size={16} />
                            Hisser les voiles !
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NavigationMap;