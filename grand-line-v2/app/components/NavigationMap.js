import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Navigation, Swords, ShoppingBag, Beer, Hammer, ZoomIn, ZoomOut, Compass, MapPin } from 'lucide-react';

// 📐 CONFIGURATION POUR TA CARTE
const MAP_IMAGE_URL = "/world_map.jpg"; // Assure-toi que l'image est ici
const MAP_WIDTH = 3000;  // Largeur de l'image (en pixels) pour une bonne résolution
const MAP_HEIGHT = 1500; // Hauteur approximative (ratio 2:1 pour cette image)
const RATIO_X = 10;      // Multiplicateur pour l'axe X (Base de données -> Pixels)
const RATIO_Y = 13;      // Multiplicateur pour l'axe Y (souvent besoin d'être un peu plus grand pour remplir la hauteur)

const NavigationMap = () => {
    const [loading, setLoading] = useState(true);
    const [mapData, setMapData] = useState(null);
    const [selectedIsland, setSelectedIsland] = useState(null);
    const [travelTimer, setTravelTimer] = useState(null);
    
    // 🔍 État du Zoom et Position
    const [scale, setScale] = useState(1);
    const constraintsRef = useRef(null);

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
                    alert(status.message); // À remplacer par un joli Toast notification plus tard
                }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [mapData?.travelStatus?.state]);

    // Timer visuel
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

    const getPinColor = (type) => {
        switch(type) {
            case 'VILLE': return 'text-blue-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]';
            case 'SAUVAGE': return 'text-green-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]';
            case 'DONJON': return 'text-purple-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]';
            case 'QG_MARINE': return 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]';
            case 'EVENT': return 'text-yellow-500 animate-bounce';
            default: return 'text-gray-400';
        }
    };

    if (loading || !mapData) return <div className="flex h-full items-center justify-center text-cyan-400 animate-pulse">Chargement de la Carte...</div>;

    const { currentLocation, travelStatus, map: islands } = mapData;
    const isSailing = travelStatus.state === 'EN_MER';

    return (
        <div className="relative w-full h-[calc(100vh-140px)] md:h-full bg-slate-900 overflow-hidden rounded-xl border border-slate-700 shadow-2xl group">
            
            {/* 🎮 CONTRÔLES DE ZOOM (Flottants) */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-black/80 p-2 rounded-lg backdrop-blur-md border border-white/10 shadow-xl">
                <button onClick={() => setScale(Math.min(scale + 0.3, 3))} className="p-2 hover:bg-white/20 rounded text-white active:scale-95 transition"><ZoomIn size={20} /></button>
                <span className="text-center text-[10px] text-slate-300 font-mono font-bold">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(Math.max(scale - 0.3, 0.5))} className="p-2 hover:bg-white/20 rounded text-white active:scale-95 transition"><ZoomOut size={20} /></button>
                <div className="h-px bg-white/20 my-1"></div>
                <button onClick={() => setScale(1)} className="p-2 hover:bg-white/20 rounded text-yellow-400 active:scale-95 transition" title="Recentrer"><Compass size={20} /></button>
            </div>

            {/* 📦 REFERENCE POUR LE DRAG (Limites) */}
            <div ref={constraintsRef} className="absolute inset-0 pointer-events-none" />

            {/* 🗺️ CARTE INTERACTIVE */}
            <motion.div 
                drag
                dragConstraints={constraintsRef}
                dragElastic={0.2}
                animate={{ scale: scale, x: 0, y: 0 }} // On peut ajouter x/y ici pour centrer au démarrage si besoin
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{ 
                    width: MAP_WIDTH, 
                    height: MAP_HEIGHT,
                    cursor: isSailing ? 'default' : 'grab',
                    backgroundImage: `url('${MAP_IMAGE_URL}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
                className="absolute shadow-2xl origin-center"
            >
                {/* 📍 LES ÎLES (MARKERS) */}
                {islands.map((island) => {
                    const isCurrent = currentLocation?.id === island.id;
                    const isTarget = travelStatus.destinationId === island.id;
                    const isSelectable = !isSailing && !isCurrent;

                    return (
                        <div
                            key={island.id}
                            className="absolute flex flex-col items-center group/marker z-10"
                            style={{ 
                                // On utilise les RATIOs pour placer les points sur la grande image
                                left: island.pos_x * RATIO_X, 
                                top: island.pos_y * RATIO_Y,
                                transform: 'translate(-50%, -100%)' // L'icône pointe sur le lieu
                            }}
                        >
                            {/* ICÔNE DE LOCALISATION */}
                            <motion.button
                                whileHover={{ scale: 1.2, y: -5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => isSelectable && setSelectedIsland(island)}
                                className={`transition-all duration-300 relative p-2
                                    ${isSelectable ? 'cursor-pointer' : 'cursor-default'}
                                `}
                            >
                                <MapPin 
                                    size={isCurrent || isTarget ? 40 : 28} 
                                    className={`${getPinColor(island.type)} fill-black/50 stroke-[1.5px]`} 
                                />
                                
                                {/* Effet d'onde si c'est la destination */}
                                {(isCurrent || isTarget) && (
                                    <div className="absolute inset-0 bg-white/30 rounded-full animate-ping opacity-75"></div>
                                )}
                            </motion.button>

                            {/* NOM DE L'ÎLE (Style RPG) */}
                            <span className={`
                                mt-[-5px] text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10 whitespace-nowrap transition-all duration-300
                                ${isCurrent ? 'bg-yellow-600/90 text-white scale-110 shadow-lg border-yellow-400' : ''}
                                ${isTarget ? 'bg-blue-600/90 text-white scale-110 shadow-lg border-blue-400 animate-pulse' : ''}
                                ${!isCurrent && !isTarget ? 'bg-black/60 text-slate-300 opacity-0 group-hover/marker:opacity-100 group-hover/marker:translate-y-1' : ''}
                            `}>
                                {island.nom}
                            </span>
                        </div>
                    );
                })}

                {/* 🚢 TRAJET EN COURS (SVG Overlay) */}
                {isSailing && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                        {(() => {
                            const start = islands.find(i => i.id === travelStatus.departId);
                            const end = islands.find(i => i.id === travelStatus.destinationId);
                            if (start && end) {
                                return (
                                    <>
                                        <line 
                                            x1={start.pos_x * RATIO_X} y1={start.pos_y * RATIO_Y - 20} // -20 pour partir du haut du pin
                                            x2={end.pos_x * RATIO_X} y2={end.pos_y * RATIO_Y - 20} 
                                            stroke="#fbbf24" strokeWidth="4" strokeDasharray="12,8" 
                                            className="animate-dash drop-shadow-md"
                                        />
                                        {/* Petit bateau sur la ligne (optionnel, pour le style) */}
                                        <circle cx={start.pos_x * RATIO_X} cy={start.pos_y * RATIO_Y - 20} r="4" fill="white" />
                                        <circle cx={end.pos_x * RATIO_X} cy={end.pos_y * RATIO_Y - 20} r="4" fill="white" />
                                    </>
                                );
                            }
                        })()}
                    </svg>
                )}
            </motion.div>

            {/* 🛑 HUD BAS (PANNEAU DE NAVIGATION) */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-700 p-3 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                {isSailing ? (
                    <div className="flex items-center gap-4 w-full px-2">
                        <div className="p-2.5 bg-blue-600 rounded-xl animate-bounce shadow-lg shadow-blue-900/50">
                            <Navigation className="text-white" size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-blue-200 mb-1.5 uppercase font-bold tracking-wider">
                                <span>Cap vers : <span className="text-white">{islands.find(i => i.id === travelStatus.destinationId)?.nom}</span></span>
                                <span className="font-mono text-yellow-400 text-sm">{new Date(travelTimer * 1000).toISOString().substr(11, 8)}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-600">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: travelTimer, ease: "linear" }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-900/30 p-2 rounded-lg border border-emerald-500/30">
                                <Anchor className="text-emerald-400" size={20} />
                            </div>
                            <div>
                                <h3 className="text-slate-200 font-bold text-sm">Position : <span className="text-emerald-400 font-pirata text-lg tracking-wide">{currentLocation?.nom || "Inconnu"}</span></h3>
                                <div className="flex gap-2 mt-0.5">
                                    {currentLocation?.facilities?.map((fac, i) => (
                                        <div key={i} title={fac} className="bg-black/40 p-1 rounded border border-white/5 text-slate-400 hover:text-white transition">
                                            {getFacilityIcon(fac)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block text-right text-[10px] text-slate-500 max-w-[150px] leading-tight italic">
                            "La fortune sourit aux audacieux. Choisissez votre prochaine destination."
                        </div>
                    </div>
                )}
            </div>

            {/* 🛑 MODALE DÉTAILS ÎLE (Popup de confirmation) */}
            <AnimatePresence>
                {selectedIsland && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-900/95 border border-slate-600 rounded-2xl shadow-2xl p-0 z-50 backdrop-blur-xl overflow-hidden"
                    >
                        {/* Header Image ou Couleur */}
                        <div className="h-20 bg-gradient-to-br from-slate-800 to-slate-900 relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <button onClick={() => setSelectedIsland(null)} className="absolute top-2 right-2 bg-black/20 hover:bg-black/50 text-white p-1 rounded-full transition">✕</button>
                            <div className="absolute bottom-2 left-4">
                                <h3 className="text-xl font-bold text-white font-pirata tracking-wide drop-shadow-md">{selectedIsland.nom}</h3>
                                <span className="text-[10px] text-blue-300 uppercase tracking-widest font-bold bg-blue-900/50 px-1.5 py-0.5 rounded">{selectedIsland.ocean}</span>
                            </div>
                        </div>
                        
                        <div className="p-4">
                            <p className="text-xs text-gray-400 mb-4 italic leading-relaxed border-l-2 border-slate-600 pl-3">
                                {selectedIsland.description}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                                <div className="bg-black/30 p-2 rounded border border-white/5 flex flex-col items-center">
                                    <span className="text-gray-500 text-[9px] uppercase font-bold">Niveau</span>
                                    <span className={`text-lg font-black ${selectedIsland.niveau_requis > 100 ? 'text-red-500' : 'text-emerald-400'}`}>
                                        {selectedIsland.niveau_requis}
                                    </span>
                                </div>
                                <div className="bg-black/30 p-2 rounded border border-white/5 flex flex-col items-center">
                                    <span className="text-gray-500 text-[9px] uppercase font-bold">Zone</span>
                                    <span className="text-sm font-bold text-white mt-0.5">{selectedIsland.type}</span>
                                </div>
                            </div>

                            {/* Liste des infras */}
                            {selectedIsland.facilities.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-[9px] text-gray-500 uppercase mb-2 font-bold tracking-wider">Services</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedIsland.facilities.map((fac) => (
                                            <span key={fac} className="px-2.5 py-1.5 bg-slate-800 rounded-md text-[10px] text-slate-300 border border-slate-700 flex items-center gap-1.5">
                                                {getFacilityIcon(fac)} {fac}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handleTravel}
                                className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 group border-t border-white/10"
                            >
                                <Navigation size={18} className="group-hover:rotate-12 transition-transform" />
                                METTRE LES VOILES
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NavigationMap;