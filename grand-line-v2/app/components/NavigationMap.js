import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Navigation, Swords, ShoppingBag, Beer, Hammer, ZoomIn, ZoomOut, Compass, MapPin } from 'lucide-react';

// 📐 CONFIGURATION DE L'IMAGE
const MAP_IMAGE_URL = "/world_map.jpg";
const MAP_WIDTH = 3000;  // Largeur réelle de l'image
const MAP_HEIGHT = 1630; // Hauteur réelle (ajustée pour le ratio de ton image one piece)

// 📐 CONFIGURATION DES COORDONNÉES (BDD -> PIXELS)
// Si ta BDD a des X de 0 à 300 et Y de 0 à 100 :
const RATIO_X = 10;      // 300 * 10 = 3000px
const RATIO_Y = 15;      // 100 * 15 = 1500px (environ)

const NavigationMap = () => {
    const [loading, setLoading] = useState(true);
    const [mapData, setMapData] = useState(null);
    const [selectedIsland, setSelectedIsland] = useState(null);
    const [travelTimer, setTravelTimer] = useState(null);
    
    // --- GESTION DU ZOOM ET DRAG ---
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [minScale, setMinScale] = useState(0.5);
    const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
    // On stocke la position x/y pour éviter les reset brutaux lors du zoom
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);

    // 1. Chargement des données
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
                    alert(status.message);
                }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [mapData?.travelStatus?.state]);

    // Timer Voyage
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

    // 2. CALCUL DES CONTRAINTES (Le cœur du fix "Bords Blancs")
    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const updateConstraints = () => {
            const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
            
            // Calcul du zoom minimum pour couvrir tout l'écran (Cover)
            const minScaleX = containerW / MAP_WIDTH;
            const minScaleY = containerH / MAP_HEIGHT;
            const newMinScale = Math.max(minScaleX, minScaleY);
            
            setMinScale(newMinScale);
            
            // Si le scale actuel est trop petit, on le remonte
            if (scale < newMinScale) setScale(newMinScale);

            // Calcul des limites de déplacement (négatives car on tire la map)
            // Formule : La map ne doit pas aller plus loin que sa taille zoomée moins la taille du container
            const xLimit = -((MAP_WIDTH * scale) - containerW);
            const yLimit = -((MAP_HEIGHT * scale) - containerH);

            setConstraints({
                left: xLimit,
                right: 0,
                top: yLimit,
                bottom: 0
            });
        };

        updateConstraints();
        window.addEventListener('resize', updateConstraints);
        return () => window.removeEventListener('resize', updateConstraints);
    }, [scale]); // Recalcule quand le zoom change

    const handleZoom = (direction) => {
        const step = 0.2;
        let newScale = direction === 'in' ? scale + step : scale - step;
        
        // Bornes
        newScale = Math.min(newScale, 3); // Max zoom x3
        newScale = Math.max(newScale, minScale); // Min zoom (cover)

        setScale(newScale);
    };

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
            case 'VILLE': return 'text-blue-400 fill-blue-900/50';
            case 'SAUVAGE': return 'text-emerald-500 fill-emerald-900/50';
            case 'DONJON': return 'text-purple-500 fill-purple-900/50';
            case 'QG_MARINE': return 'text-white fill-blue-800';
            case 'EVENT': return 'text-yellow-500 animate-bounce';
            default: return 'text-gray-400';
        }
    };

    if (loading || !mapData) return <div className="flex h-full items-center justify-center text-cyan-400 animate-pulse">Chargement de la Carte...</div>;

    const { currentLocation, travelStatus, map: islands } = mapData;
    const isSailing = travelStatus.state === 'EN_MER';

    return (
        // Conteneur principal (La fenêtre de vue)
        <div ref={containerRef} className="relative w-full h-[calc(100vh-140px)] md:h-full bg-slate-900 overflow-hidden rounded-xl border border-slate-700 shadow-2xl group">
            
            {/* 🎮 HUD CONTROLES ZOOM */}
            <div className="absolute top-4 right-4 z-[100] flex flex-col gap-2 bg-black/80 p-2 rounded-lg backdrop-blur-md border border-white/10 shadow-xl">
                <button onClick={() => handleZoom('in')} className="p-2 hover:bg-white/20 rounded text-white active:scale-95 transition"><ZoomIn size={20} /></button>
                <button onClick={() => handleZoom('out')} className="p-2 hover:bg-white/20 rounded text-white active:scale-95 transition"><ZoomOut size={20} /></button>
                <div className="h-px bg-white/20 my-1"></div>
                <button onClick={() => setScale(minScale)} className="p-2 hover:bg-white/20 rounded text-yellow-400 active:scale-95 transition" title="Vue d'ensemble"><Compass size={20} /></button>
            </div>

            {/* 🗺️ LE CANEVAS QUI BOUGE */}
            <motion.div 
                drag
                dragConstraints={constraints} // 🔒 Bloque les bords ici
                dragElastic={0.1}             // Résistance élastique sur les bords
                dragMomentum={false}          // Arrêt immédiat pour éviter de glisser hors champ
                animate={{ scale: scale }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }} // Animation fluide du zoom
                style={{ 
                    width: MAP_WIDTH, 
                    height: MAP_HEIGHT,
                    cursor: isSailing ? 'default' : 'grab',
                    originX: 0.5, // Zoom vers le centre
                    originY: 0.5,
                }}
                // Fond d'écran (Image Map)
                className="absolute top-0 left-0 bg-slate-950"
            >
                {/* L'IMAGE DE FOND */}
                <img 
                    src={MAP_IMAGE_URL} 
                    alt="World Map" 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
                />

                {/* 📍 LES POINTS (MARKERS) - Rendu DANS le contexte scalé */}
                {islands.map((island) => {
                    const isCurrent = currentLocation?.id === island.id;
                    const isTarget = travelStatus.destinationId === island.id;
                    const isSelectable = !isSailing && !isCurrent;

                    // Sécurité anti-crash si coordonnées manquantes
                    if (island.pos_x === undefined || island.pos_y === undefined) return null;

                    return (
                        <div
                            key={island.id}
                            className="absolute flex flex-col items-center group/marker z-10 hover:z-50"
                            style={{ 
                                left: island.pos_x * RATIO_X, 
                                top: island.pos_y * RATIO_Y,
                                transform: `translate(-50%, -100%) scale(${1/scale})` // 🧠 Astuce: Inverse le scale pour garder les icônes de taille constante !
                            }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.2, y: -5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => isSelectable && setSelectedIsland(island)}
                                className={`transition-all duration-300 relative p-2 ${isSelectable ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <MapPin 
                                    size={48} 
                                    className={`${getPinColor(island.type)} drop-shadow-md stroke-[1.5px]`} 
                                />
                                
                                {(isCurrent || isTarget) && (
                                    <div className="absolute inset-0 bg-yellow-400/30 rounded-full animate-ping opacity-75"></div>
                                )}
                            </motion.button>

                            {/* Label Île */}
                            <span className={`
                                mt-[-10px] text-[14px] font-black px-3 py-1 rounded-md backdrop-blur-md border border-white/20 whitespace-nowrap shadow-lg transition-all duration-300
                                ${isCurrent ? 'bg-yellow-600 text-white border-yellow-400 z-50' : 'bg-black/70 text-slate-200'}
                                ${isTarget ? 'bg-blue-600 text-white animate-pulse' : ''}
                            `}>
                                {island.nom}
                            </span>
                        </div>
                    );
                })}

                {/* 🚢 LIGNE DE TRAJET */}
                {isSailing && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                        {(() => {
                            const start = islands.find(i => i.id === travelStatus.departId);
                            const end = islands.find(i => i.id === travelStatus.destinationId);
                            if (start && end) {
                                return (
                                    <line 
                                        x1={start.pos_x * RATIO_X} y1={start.pos_y * RATIO_Y - 20}
                                        x2={end.pos_x * RATIO_X} y2={end.pos_y * RATIO_Y - 20}
                                        stroke="#fbbf24" strokeWidth={4 / scale} strokeDasharray="12,8" // Épaisseur s'adapte au zoom
                                        className="animate-dash drop-shadow-md"
                                    />
                                );
                            }
                        })()}
                    </svg>
                )}
            </motion.div>

            {/* 🛑 HUD BAS (STATUT) */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-700 p-3 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
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
                                <h3 className="text-slate-200 font-bold text-sm">Escale : <span className="text-emerald-400 font-pirata text-lg tracking-wide">{currentLocation?.nom || "En Mer"}</span></h3>
                                <div className="flex gap-2 mt-0.5">
                                    {currentLocation?.facilities?.map((fac, i) => (
                                        <div key={i} title={fac} className="bg-black/40 p-1 rounded border border-white/5 text-slate-400 hover:text-white transition">
                                            {getFacilityIcon(fac)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 🛑 MODALE DE CONFIRMATION */}
            <AnimatePresence>
                {selectedIsland && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-900/95 border border-yellow-600/30 rounded-2xl shadow-2xl p-0 z-50 backdrop-blur-xl overflow-hidden"
                    >
                        <div className="h-20 bg-gradient-to-br from-slate-800 to-slate-900 relative">
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

                            {selectedIsland.facilities.length > 0 && (
                                <div className="mb-5">
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