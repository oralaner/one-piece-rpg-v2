import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Navigation, ShoppingBag, Beer, Hammer, Swords } from 'lucide-react';

const MAP_IMAGE_URL = "/world_map.jpg"; 
const MAP_WIDTH = 3000;  
const MAP_HEIGHT = 1630; 

// ⚠️ IMPORTANT : Garde ces ratios ou modifie-les si tu changes la taille de l'image
const RATIO_X = 10; 
const RATIO_Y = 15; 

const NavigationMap = () => {
    const [loading, setLoading] = useState(true);
    const [mapData, setMapData] = useState(null);
    const [selectedIsland, setSelectedIsland] = useState(null);
    const [travelTimer, setTravelTimer] = useState(null);

    // --- GESTION DU DRAG ---
    const mapRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0, left: 0, top: 0 });

    const onMouseDown = (e) => {
        // Si on clique sur un bouton ou une île, on ne lance pas le drag
        if (e.target.closest('button')) return;
        
        setIsDragging(true);
        startPos.current = { x: e.clientX, y: e.clientY, left: mapRef.current.scrollLeft, top: mapRef.current.scrollTop };
        e.preventDefault(); 
    };

    const onMouseUp = () => setIsDragging(false);
    
    const onMouseMove = (e) => {
        if (!isDragging || !mapRef.current) return;
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        mapRef.current.scrollLeft = startPos.current.left - dx;
        mapRef.current.scrollTop = startPos.current.top - dy;
    };

    // 📍 MODE DEBUG : CLICK TO GET COORDS (SEXTANT DU DÉVELOPPEUR)
    const handleMapClick = (e) => {
        if (isDragging || e.target.closest('button')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        
        // Calcul précis basé sur la taille réelle affichée
        // On prend en compte le scroll du parent si nécessaire
        const xPixels = e.clientX - rect.left;
        const yPixels = e.clientY - rect.top;

        const dbX = Math.round(xPixels / RATIO_X);
        const dbY = Math.round(yPixels / RATIO_Y);

        alert(`📍 COORDONNÉES POUR SUPABASE :\n\npos_x : ${dbX}\npos_y : ${dbY}`);
    };

    // Chargement des données
    const fetchMap = async () => {
        try {
            const data = await api.get('/game/map');
            setMapData(data);
            setLoading(false);
            
            // Centrage initial sur le joueur
            if (data?.currentLocation && mapRef.current) {
                // On attend un tick pour que le DOM soit prêt
                setTimeout(() => {
                    if (mapRef.current) {
                        const targetX = (data.currentLocation.pos_x * RATIO_X) - (mapRef.current.clientWidth / 2);
                        const targetY = (data.currentLocation.pos_y * RATIO_Y) - (mapRef.current.clientHeight / 2);
                        mapRef.current.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });
                    }
                }, 100);
            }
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
                alert(`⚓ Cap sur ${selectedIsland.nom} !`);
            }
        } catch (e) {
            const serverMessage = e.response?.data?.message || e.message || "Erreur inconnue";
            alert(`⚠️ Le Capitaine dit : "${serverMessage}"`);
        }
    };

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

    if (loading || !mapData) return <div className="text-center p-10 text-white animate-pulse">Chargement de la Carte...</div>;

    const { currentLocation, travelStatus, map: islands } = mapData;
    const isSailing = travelStatus.state === 'EN_MER';

    return (
        <div className="relative w-full h-full bg-slate-900 overflow-hidden rounded-xl border border-slate-700 shadow-2xl group">
            
            {/* Zone de Scroll (Drag & Drop) */}
            <div 
                ref={mapRef}
                className={`w-full h-full overflow-auto no-scrollbar relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={onMouseDown} 
                onMouseMove={onMouseMove} 
                onMouseUp={onMouseUp} 
                onMouseLeave={onMouseUp}
            >
                {/* L'IMAGE ET LES POINTS (DIMENSIONS FORCÉES) */}
                <div 
                    style={{ 
                        width: MAP_WIDTH, 
                        height: MAP_HEIGHT,
                        minWidth: MAP_WIDTH,   // 👈 EMPÊCHE L'ÉCRASEMENT
                        minHeight: MAP_HEIGHT, // 👈 EMPÊCHE L'ÉCRASEMENT
                        position: 'relative' 
                    }}
                    onClick={handleMapClick} 
                >
                    {/* Fond de carte */}
                    <img 
                        src={MAP_IMAGE_URL} 
                        alt="World Map" 
                        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                        draggable="false"
                    />

                    {/* Ligne de Trajet */}
                    {isSailing && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                            {(() => {
                                const start = islands.find(i => i.id === travelStatus.departId);
                                const end = islands.find(i => i.id === travelStatus.destinationId);
                                if (start && end) {
                                    return (
                                        <line 
                                            x1={start.pos_x * RATIO_X} y1={start.pos_y * RATIO_Y}
                                            x2={end.pos_x * RATIO_X} y2={end.pos_y * RATIO_Y}
                                            stroke="#fbbf24" strokeWidth="4" strokeDasharray="10,10" 
                                            className="animate-dash drop-shadow-md opacity-80"
                                        />
                                    );
                                }
                            })()}
                        </svg>
                    )}

                    {/* Points (Îles) */}
                    {islands.map((island) => {
                        const isCurrent = currentLocation?.id === island.id;
                        const isTarget = travelStatus.destinationId === island.id;
                        const isSelectable = !isSailing && !isCurrent;

                        if (island.pos_x === undefined || island.pos_y === undefined) return null;

                        return (
                            <div
                                key={island.id}
                                className="absolute flex flex-col items-center group/marker z-20"
                                style={{ 
                                    left: island.pos_x * RATIO_X, 
                                    top: island.pos_y * RATIO_Y,
                                    transform: 'translate(-50%, -100%)' 
                                }}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); isSelectable && setSelectedIsland(island); }}
                                    className={`relative transition-transform duration-300
                                        ${isSelectable ? 'cursor-pointer hover:scale-110 hover:-translate-y-2' : 'cursor-default'}
                                    `}
                                >
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width={isCurrent || isTarget ? "48" : "32"} 
                                        height={isCurrent || isTarget ? "48" : "32"} 
                                        viewBox="0 0 24 24" 
                                        fill={isCurrent ? "#fbbf24" : isTarget ? "#3b82f6" : "#ef4444"} 
                                        stroke="black" 
                                        strokeWidth="1.5" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                        className="drop-shadow-lg"
                                    >
                                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                        <circle cx="12" cy="10" r="3" fill="black" fillOpacity="0.2" />
                                    </svg>

                                    {(isCurrent || isTarget) && (
                                        <div className="absolute inset-0 bg-white/30 rounded-full animate-ping opacity-75"></div>
                                    )}
                                </button>

                                <span className={`
                                    mt-[-5px] text-[12px] font-black px-2 py-0.5 rounded backdrop-blur-md border border-white/20 whitespace-nowrap shadow-xl transition-opacity duration-300
                                    ${isCurrent ? 'bg-yellow-600 text-white border-yellow-400 z-50 opacity-100' : 'bg-black/70 text-slate-200 opacity-0 group-hover/marker:opacity-100'}
                                `}>
                                    {island.nom}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* HUD BAS */}
            {!selectedIsland && (
                <div className="absolute bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-700 p-3 z-40 flex justify-between items-center shadow-2xl">
                    {isSailing ? (
                        <div className="flex items-center gap-4 w-full px-2">
                            <div className="p-2.5 bg-blue-600 rounded-xl animate-bounce">
                                <Navigation className="text-white" size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-xs text-blue-200 mb-1.5 uppercase font-bold tracking-wider">
                                    <span>Cap vers : <span className="text-white">{islands.find(i => i.id === travelStatus.destinationId)?.nom}</span></span>
                                    <span className="font-mono text-yellow-400 text-sm">{travelTimer > 0 ? new Date(travelTimer * 1000).toISOString().substr(11, 8) : "Arrivée..."}</span>
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
                                </div>
                            </div>
                            <div className="text-right text-[10px] text-slate-500 italic max-w-[150px]">
                                Cliquez sur la carte pour voir les coordonnées (Debug).
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODALE DÉTAILS */}
            <AnimatePresence>
                {selectedIsland && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="absolute bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t-4 border-yellow-600 shadow-2xl backdrop-blur-xl p-6 rounded-t-3xl"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-3xl font-black text-yellow-400 font-pirata tracking-wide">{selectedIsland.nom}</h3>
                                <p className="text-xs text-blue-300 font-bold uppercase tracking-widest mt-1">{selectedIsland.ocean} • {selectedIsland.type}</p>
                            </div>
                            <button onClick={() => setSelectedIsland(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white font-bold">✕</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col items-center">
                                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Niveau Requis</span>
                                <span className={`text-2xl font-black font-mono ${selectedIsland.niveau_requis > 100 ? 'text-red-500' : 'text-green-400'}`}>
                                    {selectedIsland.niveau_requis}
                                </span>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col items-center">
                                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Services</span>
                                <div className="flex gap-2 mt-1">
                                    {selectedIsland.facilities?.map((fac, i) => (
                                        <div key={i} title={fac} className="bg-white/10 p-1.5 rounded-lg text-white">
                                            {getFacilityIcon(fac)}
                                        </div>
                                    ))}
                                    {(!selectedIsland.facilities || selectedIsland.facilities.length === 0) && <span className="text-xs text-slate-600">-</span>}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleTravel}
                            className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 uppercase tracking-wider text-lg"
                        >
                            <Navigation size={24} />
                            Mettre les voiles
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NavigationMap;