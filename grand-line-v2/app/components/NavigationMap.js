import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Navigation, Map as MapIcon, Swords, ShoppingBag, Beer, Hammer, ZoomIn, ZoomOut, Compass } from 'lucide-react';

// 📐 CONFIGURATION DE L'ÉCHELLE
const MAP_WIDTH = 3200;  // Largeur réelle de la carte en pixels
const MAP_HEIGHT = 1000; // Hauteur réelle de la carte
const RATIO = 10;        // 1 unité coordonnée BDD = 10 pixels écran (ex: x:10 -> 100px)

const NavigationMap = () => {
    const [loading, setLoading] = useState(true);
    const [mapData, setMapData] = useState(null);
    const [selectedIsland, setSelectedIsland] = useState(null);
    const [travelTimer, setTravelTimer] = useState(null);
    
    // 🔍 État du Zoom et Position
    const [scale, setScale] = useState(1);
    const constraintsRef = useRef(null); // Référence pour limiter le drag

    // Récupération des données
    const fetchMap = async () => {
        try {
            const data = await api.get('/game/map');
            setMapData(data);
            setLoading(false);
        } catch (e) {
            console.error("Erreur chargement map", e);
        }
    };

    useEffect(() => {
        fetchMap();
        const interval = setInterval(async () => {
            if (mapData?.travelStatus?.state === 'EN_MER') {
                const status = await api.get('/game/map/status');
                if (status.status === 'ARRIVED') {
                    fetchMap();
                    // Tu peux remplacer par un toast
                    alert(status.message);
                }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [mapData?.travelStatus?.state]);

    // Timer local
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
                fetchMap();
                setSelectedIsland(null);
            }
        } catch (e) {
            alert(e.response?.data?.message || "Impossible de partir.");
        }
    };

    // --- RENDERERS ---
    const getFacilityIcon = (type) => {
        switch(type) {
            case 'PORT': return <Anchor size={12} className="text-blue-300" />;
            case 'SHOP': return <ShoppingBag size={12} className="text-yellow-400" />;
            case 'ARENE': return <Swords size={12} className="text-red-400" />;
            case 'TAVERNE': return <Beer size={12} className="text-orange-400" />;
            case 'FORGE': return <Hammer size={12} className="text-gray-400" />;
            default: return null;
        }
    };

    const getIslandColor = (type) => {
        switch(type) {
            case 'VILLE': return 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] border-blue-300';
            case 'SAUVAGE': return 'bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.6)] border-emerald-400';
            case 'DONJON': return 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.6)] border-purple-400';
            case 'QG_MARINE': return 'bg-white text-blue-900 border-blue-800 shadow-[0_0_20px_white]';
            case 'EVENT': return 'bg-yellow-500 animate-pulse border-yellow-200';
            default: return 'bg-gray-500';
        }
    };

    if (loading || !mapData) return <div className="text-center p-10 text-white animate-pulse">Chargement de la Carte...</div>;

    const { currentLocation, travelStatus, map: islands } = mapData;
    const isSailing = travelStatus.state === 'EN_MER';

    return (
        <div className="relative w-full h-[calc(100vh-200px)] md:h-full bg-blue-950 overflow-hidden rounded-xl border border-blue-500/30 shadow-2xl group cursor-grab active:cursor-grabbing">
            
            {/* 🎮 CONTROLES DE ZOOM */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-black/60 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                <button onClick={() => setScale(Math.min(scale + 0.2, 2))} className="p-2 hover:bg-white/20 rounded text-white"><ZoomIn size={20} /></button>
                <span className="text-center text-[10px] text-slate-400 font-mono">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(Math.max(scale - 0.2, 0.5))} className="p-2 hover:bg-white/20 rounded text-white"><ZoomOut size={20} /></button>
                <div className="h-px bg-white/20 my-1"></div>
                <button onClick={() => setScale(1)} className="p-2 hover:bg-white/20 rounded text-yellow-400" title="Reset"><Compass size={20} /></button>
            </div>

            {/* 📦 ZONE DE DRAG (REFERENCE) */}
            <div ref={constraintsRef} className="absolute inset-0 pointer-events-none" />

            {/* 🗺️ CARTE DRAGGABLE */}
            <motion.div 
                drag
                dragConstraints={constraintsRef}
                dragElastic={0.1} // Effet élastique sur les bords
                animate={{ scale: scale }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ 
                    width: MAP_WIDTH, 
                    height: MAP_HEIGHT,
                    cursor: 'grab' 
                }}
                className="absolute bg-[#0a192f] origin-top-left" // Couleur de fond mer profonde
            >
                {/* 🌊 DÉCOR DE FOND (GRILLE & TEXTURE) */}
                <div 
                    className="absolute inset-0 opacity-30" 
                    style={{ 
                        backgroundImage: `
                            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                        `,
                        backgroundSize: '100px 100px' 
                    }}
                ></div>
                
                {/* 📍 POINTS (ÎLES) */}
                {islands.map((island) => {
                    const isCurrent = currentLocation?.id === island.id;
                    const isTarget = travelStatus.destinationId === island.id;
                    const isSelectable = !isSailing && !isCurrent;

                    return (
                        <div
                            key={island.id}
                            className="absolute flex flex-col items-center group/marker z-10"
                            // 📏 POSITIONNEMENT ABSOLU PIXEL PERFECT
                            style={{ 
                                left: island.pos_x * RATIO, 
                                top: island.pos_y * RATIO,
                                transform: 'translate(-50%, -50%)' // Pour centrer le point
                            }}
                        >
                            {/* CERCLE DE L'ÎLE */}
                            <motion.button
                                whileHover={{ scale: 1.3 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => isSelectable && setSelectedIsland(island)}
                                className={`w-6 h-6 rounded-full border-2 transition-all duration-300 relative
                                    ${getIslandColor(island.type)}
                                    ${isCurrent ? 'ring-4 ring-white scale-125 z-20' : ''}
                                    ${isTarget ? 'ring-4 ring-yellow-400 animate-pulse z-20' : ''}
                                    ${!isSelectable && !isCurrent && !isTarget ? 'opacity-70 grayscale cursor-default' : 'cursor-pointer'}
                                `}
                            >
                                {/* Petit point central */}
                                {isCurrent && <div className="absolute inset-0 m-auto w-2 h-2 bg-black rounded-full"></div>}
                            </motion.button>

                            {/* NOM DE L'ÎLE (Toujours visible ou au survol) */}
                            <span className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm whitespace-nowrap border border-white/10 transition-all
                                ${isCurrent || isTarget ? 'opacity-100 scale-110 border-yellow-500/50 text-yellow-200' : 'opacity-60 group-hover/marker:opacity-100 group-hover/marker:scale-110'}
                            `}>
                                {island.nom}
                            </span>
                        </div>
                    );
                })}

                {/* 🚢 LIGNE DE TRAJET */}
                {isSailing && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {(() => {
                            const start = islands.find(i => i.id === travelStatus.departId);
                            const end = islands.find(i => i.id === travelStatus.destinationId);
                            if (start && end) {
                                return (
                                    <>
                                        <line 
                                            x1={start.pos_x * RATIO} y1={start.pos_y * RATIO} 
                                            x2={end.pos_x * RATIO} y2={end.pos_y * RATIO} 
                                            stroke="rgba(250, 204, 21, 0.5)" strokeWidth="4" strokeDasharray="10,10" 
                                            className="animate-dash"
                                        />
                                        {/* BATEAU SUR LA LIGNE (Optionnel, demandera calcul complexe pour animer) */}
                                    </>
                                );
                            }
                        })()}
                    </svg>
                )}
                
                {/* 🧭 DÉCO : GRAND LINE SEPARATOR */}
                <div className="absolute left-[950px] top-0 bottom-0 w-1 bg-red-500/20 border-r border-red-500/10 pointer-events-none"></div>
                <div className="absolute left-[960px] top-10 text-red-500/30 font-pirata text-4xl rotate-90 origin-left whitespace-nowrap pointer-events-none">RED LINE</div>

            </motion.div>

            {/* 🛑 HUD BAS (STATUT) */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-white/10 p-3 z-40 flex justify-between items-center">
                {isSailing ? (
                    <div className="flex items-center gap-4 w-full">
                        <div className="p-2 bg-blue-600 rounded-lg animate-bounce">
                            <Navigation className="text-white" size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-blue-200 mb-1">
                                <span>En voyage vers <span className="font-bold text-white">{islands.find(i => i.id === travelStatus.destinationId)?.nom}</span></span>
                                <span className="font-mono text-yellow-400 font-bold">{new Date(travelTimer * 1000).toISOString().substr(11, 8)}</span>
                            </div>
                            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-yellow-400"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: travelTimer, ease: "linear" }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <Anchor className="text-emerald-400" size={20} />
                            <div>
                                <h3 className="text-white font-bold text-sm">Escale : <span className="text-emerald-400">{currentLocation?.nom || "Inconnu"}</span></h3>
                                <div className="flex gap-1 mt-0.5">
                                    {currentLocation?.facilities?.map((fac, i) => (
                                        <div key={i} title={fac} className="bg-white/10 p-0.5 rounded border border-white/5">
                                            {getFacilityIcon(fac)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 max-w-[120px] leading-tight">
                            Cliquez sur une île et glissez pour explorer la carte.
                        </div>
                    </div>
                )}
            </div>

            {/* 🛑 MODALE DÉTAILS ÎLE (Avant Voyage) */}
            <AnimatePresence>
                {selectedIsland && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-900/95 border border-yellow-600/30 rounded-xl shadow-2xl p-4 z-50 backdrop-blur-xl"
                    >
                        <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-2">
                            <div>
                                <h3 className="text-lg font-bold text-white font-pirata tracking-wide">{selectedIsland.nom}</h3>
                                <span className="text-[10px] text-blue-300 uppercase tracking-widest">{selectedIsland.ocean}</span>
                            </div>
                            <button onClick={() => setSelectedIsland(null)} className="text-gray-400 hover:text-white bg-white/5 p-1 rounded-full">✕</button>
                        </div>
                        
                        <p className="text-xs text-gray-300 mb-4 italic leading-relaxed">"{selectedIsland.description}"</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                            <div className="bg-black/40 p-2 rounded border border-white/5">
                                <span className="text-gray-500 block text-[9px] uppercase">Niveau Requis</span>
                                <span className={`font-bold ${selectedIsland.niveau_requis > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    Niveau {selectedIsland.niveau_requis}
                                </span>
                            </div>
                            <div className="bg-black/40 p-2 rounded border border-white/5">
                                <span className="text-gray-500 block text-[9px] uppercase">Type</span>
                                <span className="text-white font-bold">{selectedIsland.type}</span>
                            </div>
                        </div>

                        {/* Liste des infras */}
                        {selectedIsland.facilities.length > 0 && (
                            <div className="mb-4">
                                <p className="text-[9px] text-gray-500 uppercase mb-1">Services disponibles</p>
                                <div className="flex flex-wrap gap-1">
                                    {selectedIsland.facilities.map((fac) => (
                                        <span key={fac} className="px-2 py-1 bg-blue-900/30 rounded text-[10px] text-blue-200 border border-blue-500/20 flex items-center gap-1">
                                            {getFacilityIcon(fac)} {fac}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleTravel}
                            className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold py-3 rounded-lg transition shadow-lg flex items-center justify-center gap-2 group"
                        >
                            <Navigation size={16} className="group-hover:rotate-12 transition-transform" />
                            Mettre les voiles
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NavigationMap;