import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Navigation, ShoppingBag, Beer, Hammer, Swords, Locate, Lock, MapPin, Skull, Compass } from 'lucide-react';

const MAP_IMAGE_URL = "/world_map.jpg"; 
const MAP_WIDTH = 3000;  
const MAP_HEIGHT = 1630; 

const RATIO_X = 10; 
const RATIO_Y = 15; 

const NavigationMap = ({ joueur }) => {
    const [loading, setLoading] = useState(true);
    const [mapData, setMapData] = useState(null);
    const [selectedIsland, setSelectedIsland] = useState(null);
    const [travelTimer, setTravelTimer] = useState(null);
    const [notification, setNotification] = useState(null);

    // --- GESTION DU DRAG ---
    const mapRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0, left: 0, top: 0 });

    const onMouseDown = (e) => {
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

    const showMapNotif = (msg, type = 'success') => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleMapClick = (e) => {
        if (isDragging || e.target.closest('button')) return;
    };

    // --- FONCTION DE CENTRAGE ---
    const centerOnTarget = (targetIsland) => {
        if (!targetIsland || !mapRef.current) return;
        const containerW = mapRef.current.clientWidth;
        const containerH = mapRef.current.clientHeight;
        const targetX = (targetIsland.pos_x * RATIO_X) - (containerW / 2);
        const targetY = (targetIsland.pos_y * RATIO_Y) - (containerH / 2);
        mapRef.current.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });
    };

    const handleRecenter = () => {
        if (!mapData) return;
        const { currentLocation, travelStatus, map: islands } = mapData;
        if (currentLocation) {
            centerOnTarget(currentLocation);
            showMapNotif("📍 Retour sur votre position", "info");
        } else if (travelStatus?.destinationId) {
            const dest = islands.find(i => i.id === travelStatus.destinationId);
            if (dest) {
                centerOnTarget(dest);
                showMapNotif("⛵ Suivi du navire vers " + dest.nom, "info");
            }
        }
    };

    const fetchMap = async (isFirstLoad = false) => {
        try {
            const data = await api.get('/game/map');
            setMapData(data);
            setLoading(false);
            if (isFirstLoad && mapRef.current) {
                setTimeout(() => {
                    if (data.currentLocation) centerOnTarget(data.currentLocation);
                    else if (data.travelStatus?.destinationId) {
                        const dest = data.map.find(i => i.id === data.travelStatus.destinationId);
                        if (dest) centerOnTarget(dest);
                    }
                }, 200);
            }
        } catch (e) {
            console.error("Erreur chargement map", e);
        }
    };

    useEffect(() => {
        fetchMap(true);
        const interval = setInterval(async () => {
            if (mapData?.travelStatus?.state === 'EN_MER') {
                const status = await api.get('/game/map/status');
                if (status.status === 'ARRIVED') {
                    fetchMap();
                    showMapNotif(status.message, "success");
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
                showMapNotif(`⚓ Cap sur ${selectedIsland.nom} ! Durée : ${res.duree} min`, "success");
            }
        } catch (e) {
            const serverMessage = e.response?.data?.message || e.message || "Erreur inconnue";
            showMapNotif(serverMessage, "error");
        }
    };

    const getFacilityIcon = (type) => {
        switch(type) {
            case 'PORT': return <Anchor size={16} className="text-blue-300" />;
            case 'SHOP': return <ShoppingBag size={16} className="text-yellow-400" />;
            case 'ARENE': return <Swords size={16} className="text-red-400" />;
            case 'TAVERNE': return <Beer size={16} className="text-orange-400" />;
            case 'FORGE': return <Hammer size={16} className="text-gray-400" />;
            default: return <MapPin size={16} className="text-slate-400" />;
        }
    };

    const getFacilityLabel = (type) => {
        switch(type) {
            case 'PORT': return 'Port';
            case 'SHOP': return 'Boutique';
            case 'ARENE': return 'Arène';
            case 'TAVERNE': return 'Taverne';
            case 'FORGE': return 'Forge';
            case 'CASINO': return 'Casino';
            default: return 'Lieu';
        }
    };

    if (loading || !mapData) return <div className="text-center p-10 text-white animate-pulse">Chargement de la Carte...</div>;

    const { currentLocation, travelStatus, map: islands } = mapData;
    const isSailing = travelStatus.state === 'EN_MER';
    const playerLevel = joueur?.niveau || 1;

    return (
        <div className="relative w-full h-full bg-slate-900 overflow-hidden rounded-xl border border-slate-700 shadow-2xl group">
            
            {/* NOTIFICATION POP-UP */}
            <AnimatePresence>
                {notification && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -50, x: "-50%" }}
                        className={`absolute top-6 left-1/2 z-[100] px-6 py-4 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center gap-3 min-w-[300px] justify-center
                        ${notification.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 'bg-slate-900/90 border-yellow-500 text-yellow-100'}`}
                    >
                        <span className="text-2xl">{notification.type === 'error' ? '⚠️' : '⛵'}</span>
                        <div>
                            <h4 className="font-black uppercase text-sm tracking-widest">{notification.type === 'error' ? 'Problème' : 'Navigation'}</h4>
                            <p className="text-xs font-medium opacity-90">{notification.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CARTE SCROLLABLE */}
            <div 
                ref={mapRef}
                className={`w-full h-full overflow-auto no-scrollbar relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={onMouseDown} 
                onMouseMove={onMouseMove} 
                onMouseUp={onMouseUp} 
                onMouseLeave={onMouseUp}
            >
                <div style={{ width: MAP_WIDTH, height: MAP_HEIGHT, minWidth: MAP_WIDTH, minHeight: MAP_HEIGHT, position: 'relative' }} onClick={handleMapClick}>
                    <img src={MAP_IMAGE_URL} alt="World Map" className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" draggable="false" />

                    {/* TRAJET */}
                    {isSailing && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                            {(() => {
                                const start = islands.find(i => i.id === travelStatus.departId);
                                const end = islands.find(i => i.id === travelStatus.destinationId);
                                if (start && end) {
                                    return <line x1={start.pos_x * RATIO_X} y1={start.pos_y * RATIO_Y} x2={end.pos_x * RATIO_X} y2={end.pos_y * RATIO_Y} stroke="#fbbf24" strokeWidth="4" strokeDasharray="10,10" className="animate-dash drop-shadow-md opacity-80" />;
                                }
                            })()}
                        </svg>
                    )}

                    {/* ÎLES (MARKERS) */}
                    {islands.map((island) => {
                        const isCurrent = currentLocation?.id === island.id;
                        const isTarget = travelStatus.destinationId === island.id;
                        const isLocked = playerLevel < island.niveau_requis;
                        const isSelectable = !isSailing && !isCurrent && !isLocked;

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
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (isLocked) showMapNotif(`Niveau ${island.niveau_requis} requis pour explorer cette île !`, "error");
                                        else if (isSelectable) setSelectedIsland(island); 
                                    }}
                                    className={`relative transition-all duration-300 ${isLocked ? 'cursor-not-allowed opacity-60 grayscale hover:scale-100' : isSelectable ? 'cursor-pointer hover:scale-110 hover:-translate-y-2' : 'cursor-default'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width={isCurrent || isTarget ? "48" : "32"} height={isCurrent || isTarget ? "48" : "32"} viewBox="0 0 24 24" fill={isLocked ? "#64748b" : (isCurrent ? "#fbbf24" : isTarget ? "#3b82f6" : "#ef4444")} stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
                                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                        {isLocked ? <path d="M12 10v-2a2 2 0 1 1 4 0v2" stroke="white" strokeWidth="2" fill="none"/> : <circle cx="12" cy="10" r="3" fill="black" fillOpacity="0.2" />}
                                    </svg>
                                    {(isCurrent || isTarget) && !isLocked && <div className="absolute inset-0 bg-white/30 rounded-full animate-ping opacity-75"></div>}
                                </button>
                                <span className={`mt-[-5px] text-[12px] font-black px-2 py-0.5 rounded backdrop-blur-md border border-white/20 whitespace-nowrap shadow-xl transition-opacity duration-300 ${isCurrent ? 'bg-yellow-600 text-white border-yellow-400 z-50 opacity-100' : 'bg-black/70 text-slate-200 opacity-0 group-hover/marker:opacity-100'} ${isLocked ? 'bg-slate-800 text-slate-500 border-slate-600' : ''}`}>
                                    {isLocked && <span className="mr-1">🔒</span>}{island.nom}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BOUTON RECENTRER */}
            <button onClick={handleRecenter} className="absolute bottom-24 right-4 z-30 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 active:scale-95 transition-all group" title="Recentrer sur ma position">
                <Locate size={24} className="group-hover:rotate-45 transition-transform duration-300" />
            </button>

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
                                    <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: travelTimer, ease: "linear" }} />
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
                            <div className="text-right text-[10px] text-slate-500 italic max-w-[150px]">Glissez pour explorer le monde.</div>
                        </div>
                    )}
                </div>
            )}

            {/* 🔥 MODALE DÉTAILS ÎLE (DESIGN "CARTE AU TRÉSOR") 🔥 */}
            <AnimatePresence>
                {selectedIsland && (
                    <motion.div 
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
                    >
                        {/* FOND AVEC EFFET DE FLOU ET DÉGRADÉ */}
                        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl border-t-4 border-yellow-600/50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"></div>
                        
                        {/* CONTENU */}
                        <div className="relative p-6 pt-8 pb-8 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
                            
                            {/* BOUTON FERMER */}
                            <button 
                                onClick={() => setSelectedIsland(null)} 
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5"
                            >
                                ✕
                            </button>

                            {/* 1. EN-TÊTE : NOM & TYPE */}
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                                    {selectedIsland.is_visited ? <Compass size={32} className="text-yellow-500" /> : <span className="text-3xl grayscale opacity-50">🏝️</span>}
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 font-pirata tracking-wide drop-shadow-md leading-none mb-1">
                                        {selectedIsland.nom}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                        <span className="text-blue-400">{selectedIsland.ocean}</span>
                                        <span>•</span>
                                        <span>{selectedIsland.type}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. GRILLE D'INFOS */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* DIFFICULTÉ / NIVEAU */}
                                <div className={`p-3 rounded-xl border flex items-center gap-3 ${playerLevel >= selectedIsland.niveau_requis ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold border ${playerLevel >= selectedIsland.niveau_requis ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                        {selectedIsland.niveau_requis}
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Difficulté</p>
                                        <p className={`text-sm font-bold ${playerLevel >= selectedIsland.niveau_requis ? 'text-emerald-300' : 'text-red-300'}`}>
                                            {playerLevel >= selectedIsland.niveau_requis ? "Abordable" : "Dangereux"}
                                        </p>
                                    </div>
                                </div>

                                {/* RESSOURCES / SERVICES */}
                                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5 flex flex-col justify-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Points d'intérêt</p>
                                    
                                    {selectedIsland.is_visited ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedIsland.facilities?.length > 0 ? (
                                                selectedIsland.facilities.map((fac, i) => (
                                                    <div key={i} title={getFacilityLabel(fac)} className="w-8 h-8 rounded-lg bg-slate-700/50 border border-white/10 flex items-center justify-center hover:bg-slate-600 transition-colors cursor-help">
                                                        {getFacilityIcon(fac)}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-500 italic">Aucun service</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 opacity-50">
                                            <span className="text-xl">❓</span>
                                            <span className="text-xs text-slate-400 italic">Zone Inconnue</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. DESCRIPTION (Si visité) */}
                            {selectedIsland.is_visited && selectedIsland.description && (
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <p className="text-sm text-slate-300 italic leading-relaxed">
                                        "{selectedIsland.description}"
                                    </p>
                                </div>
                            )}

                            {/* 4. BOUTON ACTION */}
                            <button 
                                onClick={handleTravel}
                                disabled={playerLevel < selectedIsland.niveau_requis}
                                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-lg shadow-lg flex items-center justify-center gap-3 transition-all duration-300
                                    ${playerLevel < selectedIsland.niveau_requis 
                                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white border-t border-white/20 active:scale-95 hover:shadow-blue-900/50'}
                                `}
                            >
                                {playerLevel < selectedIsland.niveau_requis ? (
                                    <> <Lock size={20} /> Niveau Insuffisant </>
                                ) : (
                                    <> <Navigation size={24} className={playerLevel >= selectedIsland.niveau_requis ? "animate-pulse" : ""} /> Mettre les voiles </>
                                )}
                            </button>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NavigationMap;