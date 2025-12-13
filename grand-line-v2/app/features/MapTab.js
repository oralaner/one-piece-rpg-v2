import React, { useState, useEffect, useRef } from 'react';
import { formatChronoLong } from '../utils/gameUtils';

const MapTab = ({ destinations, joueur, expeditionChrono, onTravel, onCollect, theme, meteoData, equipement }) => {
    const [selectedDest, setSelectedDest] = useState(null);
    const mapRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0, left: 0, top: 0 });

    // --- LOGIQUE DRAG (PC) ---
    const onMouseDown = (e) => {
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

   // --- CALCUL CHANCE (Basé sur les Stats Totales & Équipement) ---
    const getSuccessRate = (dest) => {
        if (!joueur) return 0;

        // 1. Calcul de la PUISSANCE MOYENNE du joueur
        // On suppose que joueur.statsTotales est un objet calculé qui contient les totaux (Base + Équipement)
        // Si tu n'as pas de statsTotales, on prend les stats de base du joueur (pas idéal, mais sécurisé)
        const stats = joueur.statsTotales || { 
            force: joueur.force || 0, 
            agilite: joueur.agilite || 0, 
            intelligence: joueur.intelligence || 0 
        };
        
        // Formule de Puissance Mixte (pour une approche générale de l'exploration)
        // On donne plus de poids à la Force et l'Agilité pour l'exploration physique.
        const puissanceJoueur = (stats.force * 1.5) + (stats.agilite * 1.2) + (stats.intelligence * 1.0);
        
        // 2. Définir la DIFFICULTÉ de l'île
        // On utilise la difficulté (qui devrait être élevée par les créateurs) ou le niveau * 30
        const difficulteIle = dest.difficulte || (dest.niveau_requis * 30); 

        // 3. Calcul de la Chance (Pivot 50% au niveau de difficulté/puissance égale)
        // Ratio = Puissance Joueur / Difficulté de l'île
        let ratio = puissanceJoueur / Math.max(1, difficulteIle);
        
        // On utilise un facteur de conversion plus faible (par exemple 20) pour ne pas atteindre 100% trop vite.
        // On veut que ratio = 1 (Puissance égale) donne environ 50%
        // Si ratio = 1, (1 * 50) = 50%
        let percent = Math.floor(ratio * 50);

        // Ajustement pour éviter les résultats trop bas (même un niveau 1 doit avoir une chance)
        // Si percent est trop bas, on ajoute un ajustement basé sur le niveau (ex: Niveau * 1%)
        percent += Math.max(0, joueur.niveau / 2); // Ajustement de base par niveau

        // 4. Bornes (Min 10% - Max 95% pour garder un léger risque)
        return Math.max(10, Math.min(95, percent));
    };
    // --- DONNÉES MÉTÉO SÉCURISÉES ---
    const currentMeteo = meteoData || { 
        id: 'CLEAR', 
        nom: 'Grand Soleil', 
        icon: '☀️', 
        description: 'Mer calme, navigation optimale.', 
        bonus_vitesse: 1.0, 
        msBeforeUpdate: 0 
    };

    // --- ÉTATS D'EXPÉDITION ---
    const isArrived = (joueur.expedition_fin && new Date(joueur.expedition_fin) < new Date()) || (expeditionChrono === 0 && joueur.expedition_fin);
    const isTraveling = expeditionChrono !== null && expeditionChrono > 0;

    // VUE 1 : TERRE EN VUE (ARRIVÉ)
    if (isArrived) {
        return (
            <div className="relative flex flex-col items-center justify-center h-full rounded-xl overflow-hidden text-center shadow-2xl border-4 border-yellow-600/50 animate-fadeIn bg-slate-900">
                <style jsx>{`
                    .animate-bounce-slow { animation: bounce 3s infinite; }
                    .animate-spin-slow { animation: spin 4s linear infinite; }
                    @keyframes bounce { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(5%); } }
                `}</style>

                <div className="absolute inset-0 bg-gradient-to-b from-sky-800 to-blue-950"></div>
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                <div className="absolute top-10 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>

                <div className="relative z-10 flex flex-col items-center gap-6 p-6">
                    <div className="text-8xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] animate-bounce-slow">🏝️</div>
                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-black uppercase font-pirata text-yellow-400 tracking-widest drop-shadow-md">Terre en Vue !</h2>
                        <p className="text-sm md:text-base text-blue-200 font-bold uppercase tracking-wide">Destination atteinte</p>
                    </div>
                    <button onClick={onCollect} className="group relative mt-4 px-10 py-5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-black text-lg md:text-xl uppercase rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                        <span className="relative z-10 flex items-center gap-3"><span className="text-2xl animate-spin-slow">⚓</span> Jeter l'Ancre <span className="text-2xl animate-spin-slow">⚓</span></span>
                    </button>
                </div>
            </div>
        );
    }

    // VUE 2 : EN NAVIGATION
    if (isTraveling) {
        return (
            <div className="flex flex-col items-center justify-center h-full rounded-xl bg-gradient-to-b from-sky-900 to-blue-950 text-white text-center space-y-6 animate-fadeIn relative overflow-hidden border-4 border-blue-900">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="w-40 h-40 rounded-full bg-blue-900/30 border-4 border-blue-500/50 flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(59,130,246,0.2)] z-10">
                    <span className="text-7xl animate-[shipRock_3s_ease-in-out_infinite] block" style={{ transformOrigin: 'bottom center' }}>⛵</span>
                </div>
                <div className="z-10">
                    <h2 className="text-3xl font-black uppercase font-pirata tracking-widest mb-2">En Navigation</h2>
                    <div className="text-5xl font-mono font-black text-cyan-300 drop-shadow-lg tracking-widest">{formatChronoLong(expeditionChrono)}</div>
                </div>
                <p className="text-xs text-slate-400 italic max-w-xs z-10">"Le vent souffle fort aujourd'hui... Gardez le cap !"</p>
                <style jsx>{`@keyframes shipRock { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }`}</style>
            </div>
        );
    }
    
    // VUE 3 : CARTE INTERACTIVE
    return (
        <div className="w-full h-full rounded-xl border-4 border-[#3e2723] shadow-2xl relative overflow-hidden bg-[#1a4c6e] group">
            
            {/* Widget Météo (Inchangé) */}
            <div className="absolute top-4 left-4 z-50 bg-slate-900/90 backdrop-blur-md border border-white/20 p-3 pr-5 rounded-2xl flex items-center gap-3 shadow-2xl max-w-[220px]">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-3xl border border-white/10 shrink-0 shadow-inner">
                    {currentMeteo.icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">MÉTÉO DU MONDE</span>
                        {currentMeteo.msBeforeUpdate > 0 && (
                            <span className="text-[9px] font-mono text-blue-400 animate-pulse">
                                ⏱ {Math.ceil(currentMeteo.msBeforeUpdate / 1000 / 60)}m
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-black uppercase leading-none mb-1 text-white truncate drop-shadow-md">{currentMeteo.nom}</p>
                    <p className="text-[10px] text-slate-300 italic leading-tight truncate opacity-80">{currentMeteo.description}</p>
                </div>
            </div>

            {/* CONTENEUR SCROLLABLE (DRAG & DROP) */}
            <div 
                ref={mapRef}
                className={`w-full h-full overflow-auto no-scrollbar relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            >
                {/* 👇 MODIF 1 : Largeur Fixe w-[2500px] au lieu de min-w */}
                <div className="relative w-[2500px] h-[1500px]">
                    
                    {/* 👇 MODIF 2 : object-fill au lieu de object-cover pour voir les bords */}
                    <img 
                        src="/world_map.jpg" 
                        alt="Carte" 
                        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none brightness-90" 
                        draggable="false"
                    />
                    
                    {destinations.map((dest, i) => {
                        const isLocked = joueur.niveau < dest.niveau_requis;
                        return (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setSelectedDest(dest); }}
                                onTouchEnd={(e) => { e.stopPropagation(); setSelectedDest(dest); }}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 z-10 group/pin ${isLocked ? 'grayscale opacity-70 scale-75' : 'hover:scale-125 hover:z-20'}`}
                                style={{ left: `${dest.pos_x}%`, top: `${dest.pos_y}%` }}
                            >
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg border-2 text-lg md:text-2xl transition-colors ${selectedDest?.id === dest.id ? 'bg-yellow-400 border-white text-black scale-125 animate-bounce' : isLocked ? 'bg-slate-800 border-slate-600 text-slate-500' : 'bg-white border-blue-600'}`}>
                                    {isLocked ? '🔒' : dest.type_lieu === 'VILLAGE' ? '🏠' : '🏝️'}
                                </div>
                                <span className={`mt-1 px-2 py-1 rounded text-[10px] md:text-xs font-black uppercase bg-black/80 text-white backdrop-blur-sm shadow-md whitespace-nowrap transition-opacity ${selectedDest?.id === dest.id ? 'opacity-100' : 'opacity-0 group-hover/pin:opacity-100'}`}>
                                    {dest.nom}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* BANDEAU BAS (Inchangé) */}
            {selectedDest && (
                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/20 p-4 animate-slideUp z-50 flex flex-col md:flex-row gap-4 justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-3xl shrink-0">
                            {selectedDest.type_lieu === 'VILLAGE' ? '🏠' : '🏝️'}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase font-pirata tracking-wide leading-none">{selectedDest.nom}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {selectedDest.region} • <span className={joueur.niveau >= selectedDest.niveau_requis ? "text-green-400" : "text-red-500"}>Niv {selectedDest.niveau_requis}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-x-6 gap-y-2 w-full md:w-auto border-t md:border-none border-white/10 pt-3 md:pt-0">
                        <div className="flex gap-4 text-right">
                            <div>
                                <p className="text-[10px] uppercase text-slate-500 font-bold">Chance de réussite</p>
                                <p className="text-[30px] font-mono font-black text-lg text-yellow-400">{getSuccessRate(selectedDest)}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-500 font-bold">Gain approximatif</p>
                                <p className="text-[30px] font-mono font-bold text-yellow-400">~{selectedDest.gain_estime} ฿</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onTravel(selectedDest)} disabled={joueur.niveau < selectedDest.niveau_requis} className={`h-10 px-6 rounded-lg font-black uppercase shadow-lg text-xs tracking-wider ${joueur.niveau >= selectedDest.niveau_requis ? theme.btnPrimary : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
                                {joueur.niveau >= selectedDest.niveau_requis ? 'PARTIR' : 'BLOQUÉ'}
                            </button>
                            <button onClick={() => setSelectedDest(null)} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-600 hover:bg-slate-800 text-slate-400 transition">✕</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapTab;