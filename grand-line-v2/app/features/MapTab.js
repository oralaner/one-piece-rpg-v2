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

   // --- CALCUL CHANCE (Version Ré-étalonnée et Stricte) ---
    const getSuccessRate = (dest) => {
        if (!joueur || !joueur.statsTotales) return 10; // 10% par défaut si stats non chargées

        // 1. Calcul de la PUISSANCE MOYENNE du joueur (identique au Backend)
        const stats = joueur.statsTotales;
        
        // Priorité aux stats physiques pour l'exploration
        const puissanceJoueur = (stats.force * 1.5) + (stats.agilite * 1.2) + (stats.intelligence * 1.0);
        
        // 2. Définir la DIFFICULTÉ de l'île
        // On utilise 'difficulte' si disponible, sinon on se base sur le niveau * 30.
        const difficulteIle = dest.difficulte || (dest.niveau_requis * 30) || 30; 

        // 3. Calcul de la Chance (Formule stricte : +20 points pour la base)
        let ratio = puissanceJoueur / Math.max(1, difficulteIle);
        
        // Pivot bas: Si Puissance = Difficulté, Chance ≈ 40% (20 + 20)
        let percent = Math.floor(ratio * 20) + 20;

        // 4. Ajustement de niveau (pour aider les joueurs qui ont grindé des niveaux sans optimiser les stats)
        percent += Math.max(0, (joueur.niveau || 1) / 5); // +1% tous les 5 niveaux

        // 5. Bornes (Min 10% - Max 95% pour laisser un peu de risque)
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

            {/* BANDEAU BAS : DÉTAILS DE LA DESTINATION (Esthétique Améliorée) */}
            {selectedDest && (
                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t-4 border-yellow-700/50 p-4 animate-slideUp z-50 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    
                    {/* LIGNE 1 : TITRE & RÉGION */}
                    <div className="flex items-start gap-4 mb-4 pb-2 border-b border-white/10">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-700 to-black/50 border-2 border-yellow-500/50 flex items-center justify-center text-4xl shrink-0 shadow-inner">
                            {selectedDest.type_lieu === 'VILLAGE' ? '🏠' : selectedDest.type_lieu === 'CELESTE' ? '☁️' : '🏝️'}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-yellow-400 uppercase font-pirata tracking-wide leading-none drop-shadow-lg">{selectedDest.nom}</h3>
                            <p className="text-sm text-slate-300 font-bold uppercase tracking-widest mt-1">
                                {selectedDest.region} • <span className={joueur.niveau >= selectedDest.niveau_requis ? "text-green-400" : "text-red-500"}>Niv Requis: {selectedDest.niveau_requis}</span>
                            </p>
                        </div>
                    </div>
                    
                    {/* LIGNE 2 : STATISTIQUES CLÉS (Divisé en 3 colonnes) */}
                    <div className="flex justify-between items-center w-full gap-4 text-center">
                        
                        {/* 1. DURÉE ESTIMÉE */}
                        <div className="flex-1 p-2 border-r border-white/10">
                            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Durée</p>
                            <p className="text-2xl font-mono font-black text-white mt-1">
                                {selectedDest.duree_minutes}m
                            </p>
                        </div>

                        {/* 2. CHANCE DE RÉUSSITE */}
                        <div className="flex-1 p-2 border-r border-white/10">
                            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Réussite</p>
                            <p className={`text-2xl font-mono font-black mt-1 ${getSuccessRate(selectedDest) > 70 ? 'text-green-400' : getSuccessRate(selectedDest) > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {getSuccessRate(selectedDest)}%
                            </p>
                        </div>

                        {/* 3. GAIN APPROXIMATIF */}
                        <div className="flex-1 p-2">
                            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Gain estimé</p>
                            <p className="text-2xl font-mono font-black text-yellow-400 mt-1">
                                ~{selectedDest.gain_estime.toLocaleString()} ฿
                            </p>
                        </div>
                    </div>

                    {/* LIGNE 3 : BOUTONS D'ACTION */}
                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                        <button 
                            onClick={() => onTravel(selectedDest)} 
                            disabled={joueur.niveau < selectedDest.niveau_requis} 
                            className={`h-10 px-6 rounded-lg font-black uppercase shadow-lg text-sm tracking-wider transition-all duration-300 ${joueur.niveau >= selectedDest.niveau_requis ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:scale-[1.02]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                        >
                            {joueur.niveau >= selectedDest.niveau_requis ? 'LANCER L\'EXPÉDITION' : 'NIVEAU INSUFFISANT'}
                        </button>
                                                <button onClick={() => setSelectedDest(null)} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-600 hover:bg-slate-800 text-slate-400 transition">✕</button>

                    </div>
                </div>
            )}
        </div>
    );
};

export default MapTab;