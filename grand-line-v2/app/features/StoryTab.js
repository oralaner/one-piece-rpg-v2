import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

const StoryTab = ({ userId, notify, theme, onStartFight, setLevelUpData }) => {
    const queryClient = useQueryClient();
    const [currentView, setCurrentView] = useState('MAP');
    const [clickCount, setClickCount] = useState(0);

    // --- GESTION CARTE ---
    const mapRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0, left: 0, top: 0 });

    const { data: story, isLoading: storyLoading } = useQuery({
        queryKey: ['story', userId],
        queryFn: () => api.get(`/game/story/progress/${userId}`),
    });

    const { data: destinations, isLoading: mapLoading } = useQuery({
        queryKey: ['destinations', userId],
        queryFn: () => api.get(`/game/destinations/${userId}`),
    });

    // 🔥 DÉTECTION : L'HISTOIRE EST-ELLE FINIE ?
    const isStoryFinished = story?.completed;

    useEffect(() => {
        setClickCount(0);
        // Si l'histoire est finie, on force la vue Carte (on ne peut pas aller en mission)
        if (isStoryFinished) {
            setCurrentView('MAP');
        }
    }, [story?.etape?.id, isStoryFinished]);

    const validateMutation = useMutation({
        mutationFn: () => api.post('/game/story/validate', { userId }),
        onSuccess: (res) => {
            if (res.chapterFinished) {
                notify("CHAPITRE TERMINÉ ! 🎉", "success");
                setCurrentView('MAP');
            }
            if (res.newLevel && setLevelUpData) {
                setLevelUpData({ level: res.newLevel });
            }
            queryClient.invalidateQueries(['story', userId]);
            queryClient.invalidateQueries(['destinations', userId]);
            queryClient.invalidateQueries(['playerData']); 
        },
        onError: (err) => notify(err.message || "Action impossible", "error")
    });

    // --- LOGIQUE DU BOUTON D'ACTION ---
    const handleActionClick = () => {
        if (!story || !story.etape) return;
        const etape = story.etape;

        if (etape.type === 'COMBAT_PVE') {
            validateMutation.mutate(null, {
                onSuccess: () => notify("Victoire confirmée ! L'histoire continue.", "success"),
                onError: (err) => {
                    if (onStartFight) onStartFight(etape.target_nom);
                    else notify(err.message, "error");
                }
            });
            return;
        }

        if (etape.type === 'ACTION' && etape.quantite > 1) {
            if (clickCount >= etape.quantite || validateMutation.isPending) return;
            const newCount = clickCount + 1;
            setClickCount(newCount);
            if (newCount >= etape.quantite) validateMutation.mutate();
            return;
        }

        validateMutation.mutate();
    };

    // --- HELPER ACTION INFO ---
    const getActionInfo = (type) => {
        switch (type) {
            case 'COMBAT_PVE': return { icon: '⚔️', label: 'COMBATTRE', color: 'bg-red-600 hover:bg-red-500 border-red-400' };
            case 'LIVRAISON': return { icon: '📦', label: 'LIVRER / RÉCUPÉRER', color: 'bg-orange-600 hover:bg-orange-500 border-orange-400' };
            case 'ACTION': return { icon: '💪', label: 'CONTINUER', color: 'bg-blue-600 hover:bg-blue-500 border-blue-400' };
            default: return { icon: '💬', label: 'CONTINUER', color: 'bg-yellow-600 hover:bg-yellow-500 border-yellow-400' };
        }
    };

    // --- AUTO-FOCUS CARTE ---
    useEffect(() => {
        if (mapRef.current && destinations && currentView === 'MAP' && !isStoryFinished) {
            const target = destinations.find(d => d.is_story_objective);
            if (target) {
                const MAP_W = 2500; const MAP_H = 1500;
                const targetX = MAP_W * (target.pos_x / 100);
                const targetY = MAP_H * (target.pos_y / 100);
                mapRef.current.scrollTo({ left: targetX - (mapRef.current.clientWidth / 2), top: targetY - (mapRef.current.clientHeight / 2), behavior: 'instant' });
            }
        }
    }, [destinations, currentView, isStoryFinished]);

    // --- DRAG CARTE ---
    const onMouseDown = (e) => { setIsDragging(true); startPos.current = { x: e.clientX, y: e.clientY, left: mapRef.current.scrollLeft, top: mapRef.current.scrollTop }; };
    const onMouseUp = () => setIsDragging(false);
    const onMouseMove = (e) => {
        if (!isDragging || !mapRef.current) return;
        e.preventDefault();
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        mapRef.current.scrollLeft = startPos.current.left - dx;
        mapRef.current.scrollTop = startPos.current.top - dy;
    };

    if (storyLoading || mapLoading) return <div className="flex justify-center items-center h-full"><span className="animate-spin text-4xl text-yellow-500">🧭</span></div>;

    // ====================================================================================
    // ⚔️ VUE MISSION (DEUX COLONNES) - Cachée si histoire finie
    // ====================================================================================
    if (currentView === 'MISSION' && !isStoryFinished) {
        if (!story) return <div className="p-10 text-center text-white">Chargement...</div>;
        const { chapitreTitre, chapitreDesc, etape, totalEtapes } = story;
        const progressPercent = (etape.ordre / totalEtapes) * 100;
        
        const action = getActionInfo(etape.type);
        const isActionType = etape.type === 'ACTION' && etape.quantite > 1;
        const actionProgress = isActionType ? Math.min(100, (clickCount / etape.quantite) * 100) : 0;
        const isButtonDisabled = validateMutation.isPending || (isActionType && clickCount >= etape.quantite);

        return (
            <div className="flex flex-col h-full max-w-6xl mx-auto animate-fadeIn relative p-4">
                <button onClick={() => setCurrentView('MAP')} className="absolute top-0 left-4 z-50 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full border border-slate-600 backdrop-blur-md">⬅ Carte</button>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-8 flex-1 overflow-hidden">
                    <div className={`lg:col-span-2 flex flex-col bg-slate-900/90 border-2 ${theme.border} rounded-2xl shadow-xl relative overflow-hidden shrink-0`}>
                        <div className="p-6 pb-4">
                            <h1 className="text-3xl font-black font-pirata text-white tracking-wide drop-shadow-md mb-2">{chapitreTitre}</h1>
                            <p className="text-slate-400 text-sm italic border-l-2 border-slate-600 pl-3 leading-relaxed">"{chapitreDesc}"</p>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-700 mt-auto bg-slate-800/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold uppercase tracking-wider text-yellow-500">Progression</span>
                                <span className="text-xs text-slate-400 font-mono">Étape {etape.ordre} <span className="text-slate-600">/ {totalEtapes}</span></span>
                            </div>
                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-700" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-3 flex flex-col bg-black/20 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="w-20 h-20 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center shadow-lg mb-4 animate-float shrink-0 mx-auto lg:mx-0">
                            <span className="text-4xl">{action.icon}</span>
                        </div>
                        <div className="text-center lg:text-left space-y-2 mb-6 flex-1 overflow-y-auto custom-scrollbar">
                            <h3 className="text-xl font-bold text-white uppercase tracking-widest">Objectif Actuel</h3>
                            <p className="text-slate-300 text-base font-medium leading-relaxed">{etape.description}</p>
                            {etape.target_nom && (<div className="inline-block mt-4 px-4 py-2 bg-slate-800 rounded-lg border border-slate-600 text-yellow-400 font-mono text-sm">🎯 Cible : <span className="font-bold text-white">{etape.target_nom}</span> {etape.quantite > 1 && `(x${etape.quantite})`}</div>)}
                        </div>
                        
                        <div className="w-full max-w-md relative shrink-0 mt-auto mx-auto lg:mx-0">
                            {actionProgress > 0 && (
                                <div className="absolute -top-3 left-0 w-full h-2 bg-slate-700 rounded-full overflow-hidden border border-black">
                                    <div className="h-full bg-green-500 transition-all duration-100" style={{ width: `${actionProgress}%` }}></div>
                                </div>
                            )}
                            <button 
                                onClick={handleActionClick}
                                disabled={isButtonDisabled} 
                                className={`w-full py-4 rounded-xl border-b-4 shadow-xl transform active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-3 text-white font-black text-lg uppercase tracking-widest ${action.color} 
                                ${isButtonDisabled ? 'opacity-50 cursor-wait bg-slate-600 border-slate-800' : ''}`}
                            >
                                {validateMutation.isPending ? <span className="animate-pulse flex items-center gap-2">⏳ Validation...</span> : <><span className={`text-2xl ${etape.type === 'ACTION' ? 'active:scale-150 transition-transform' : ''}`}>{action.icon}</span> {isActionType ? (clickCount >= etape.quantite ? "TERMINÉ !" : `${clickCount} / ${etape.quantite}`) : action.label}</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // ====================================================================================
    // 🗺️ VUE CARTE (Avec Overlay de Fin si nécessaire)
    // ====================================================================================
    return (
        <div className="w-full h-full rounded-xl border-4 border-[#3e2723] shadow-2xl relative overflow-hidden bg-[#1a4c6e] group animate-fadeIn">
            
            {/* Header Map */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-center">
                <h2 className="text-yellow-500 font-pirata text-2xl tracking-widest uppercase">Carte de l'Aventure</h2>
            </div>

            {/* 🔥 OVERLAY DE FIN DE CONTENU */}
            {isStoryFinished && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="text-center p-8 max-w-lg border border-yellow-600/30 rounded-3xl bg-slate-900/90 shadow-2xl relative overflow-hidden">
                        {/* Effet lumineux de fond */}
                        <div className="absolute inset-0 bg-yellow-500/5 rounded-3xl blur-xl animate-pulse"></div>
                        
                        <div className="relative z-10">
                            <div className="text-6xl mb-4 animate-bounce-slow">⏳</div>
                            <h2 className="text-4xl font-black font-pirata text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600 mb-4 tracking-wide">
                                AVENTURE À SUIVRE...
                            </h2>
                            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                                Vous avez atteint la fin des chapitres disponibles !<br/>
                                <span className="text-sm text-slate-500 italic">De nouvelles terres seront bientôt découvertes...</span>
                            </p>
                            
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-sm text-slate-400">
                                <p className="uppercase font-bold text-yellow-500 mb-2">En attendant la mise à jour :</p>
                                <ul className="text-left space-y-1 list-disc list-inside">
                                    <li><b>Explorer</b> les îles de One Piece 🗺️</li>
                                    <li>Grimpez dans le <b>Classement PVP</b> ⚔️</li>
                                    <li>Développez votre <b>personnage</b> 🏴‍☠️</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CARTE */}
            <div 
                ref={mapRef}
                className={`w-full h-full overflow-auto no-scrollbar relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            >
                <div className="relative w-[2500px] h-[1500px]">
                    <img src="/world_map.jpg" alt="Carte" className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none brightness-75 contrast-125" draggable="false"/>
                    
                    {destinations && destinations.map((dest) => {
                        // Si fini, on montre tout sans verrou (ou tout verrouillé, au choix). Ici on laisse affiché.
                        if (!isStoryFinished && dest.est_verrouillee && !dest.is_story_objective) return null;
                        
                        const isMissionTarget = dest.is_story_objective && !isStoryFinished;
                        
                        return (
                            <button
                                key={dest.id}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (isStoryFinished) {
                                        notify("Vous avez terminé l'histoire pour le moment !", "info");
                                    } else if (isMissionTarget) {
                                        setCurrentView('MISSION'); 
                                    } else {
                                        notify("Zone déjà explorée.", "info"); 
                                    }
                                }}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 z-10 group/pin hover:z-20 hover:scale-110`}
                                style={{ left: `${dest.pos_x}%`, top: `${dest.pos_y}%` }}
                            >
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.8)] border-4 text-2xl transition-colors ${isMissionTarget ? 'bg-red-600 border-white text-white animate-bounce shadow-red-500/50' : 'bg-slate-800 border-slate-600 text-slate-500 grayscale'}`}>{isMissionTarget ? '⚔️' : '🏁'}</div>
                                {isMissionTarget && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-black text-xs px-3 py-1 rounded shadow-lg animate-pulse whitespace-nowrap border-2 border-white z-50">! MISSION !</div>}
                                <span className={`mt-2 px-3 py-1 rounded text-xs font-black uppercase backdrop-blur-md shadow-md whitespace-nowrap border ${isMissionTarget ? 'bg-red-900/90 text-white border-red-500' : 'bg-black/60 text-slate-400 border-slate-700'}`}>{dest.nom}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StoryTab;