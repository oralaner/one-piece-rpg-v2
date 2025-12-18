import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Coins, CheckCircle, Lock } from 'lucide-react';

const ActivityWidget = ({ joueur, onUpdate }) => {
    const [activities, setActivities] = useState([]);
    const [currentActivity, setCurrentActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    
    const [rewards, setRewards] = useState(null); 

    // --- 1. CHARGEMENT ---
    const fetchActivities = async () => {
        try {
            const data = await api.get('/game/activities');
            setActivities(data.available || []);
            setCurrentActivity(data.in_progress);
            setLoading(false);
        } catch (e) {
            console.error("Erreur chargement activités", e);
        }
    };

    useEffect(() => {
        fetchActivities();
        const interval = setInterval(fetchActivities, 10000);
        return () => clearInterval(interval);
    }, [joueur.localisation?.id]);

    // --- 2. TIMERS ---
    useEffect(() => {
        const timer = setInterval(() => {
            if (currentActivity && !currentActivity.isFinished) {
                setCurrentActivity(prev => {
                    if (!prev) return null;
                    const nextRemaining = prev.remainingSeconds - 1;
                    if (nextRemaining <= 0) return { ...prev, remainingSeconds: 0, isFinished: true };
                    return { ...prev, remainingSeconds: nextRemaining };
                });
            }

            setActivities(prevList => prevList.map(act => {
                if (act.isOnCooldown && act.cooldownSeconds > 0) {
                    return { ...act, cooldownSeconds: act.cooldownSeconds - 1 };
                }
                if (act.isOnCooldown && act.cooldownSeconds <= 0) {
                    return { ...act, isOnCooldown: false };
                }
                return act;
            }));
        }, 1000);

        return () => clearInterval(timer);
    }, [currentActivity]);

    // --- 3. ACTIONS ---
    const handleStart = async (actId) => {
        try {
            setLoading(true);
            await api.post('/game/activities/start', { activityId: actId });
            await fetchActivities();
            if(onUpdate) onUpdate();
        } catch (e) {
            alert(e.response?.data?.message || "Impossible de lancer l'activité");
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async () => {
        // Sécurité anti-spam clic
        if (claiming) return;

        try {
            setClaiming(true);
            console.log("🖱️ Clic détecté sur Récupérer !"); // Debug visuel console

            const res = await api.post('/game/activities/claim');
            
            console.log("✅ Récompense reçue :", res);
            setRewards(res.loots);
            await fetchActivities();
            if(onUpdate) onUpdate();
        } catch (e) {
            console.error("❌ Erreur Claim :", e);
            const msg = e.response?.data?.message || "Erreur inconnue";
            alert(`Erreur : ${msg}`);
        } finally {
            setClaiming(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading && activities.length === 0) return <div className="h-40 bg-slate-900/50 animate-pulse rounded-2xl"></div>;
    if (!currentActivity && activities.length === 0) return null;

    return (
        <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl relative overflow-hidden">
            
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🛠️</span>
                <h3 className="text-sm font-black uppercase text-slate-300 tracking-widest">Activités Locales</h3>
            </div>

            {/* --- ZONE ACTIVITÉ EN COURS --- */}
            <AnimatePresence>
                {currentActivity && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6 bg-slate-800/80 border border-blue-500/30 rounded-xl p-4 shadow-lg relative overflow-hidden"
                    >
                        {/* 🛠️ CORRECTION 1 : pointer-events-none sur le fond */}
                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none"></div>

                        <div className="relative z-10 flex justify-between items-center mb-2">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                {currentActivity.isFinished ? "✅ Terminé !" : "⏳ En cours..."}
                            </h4>
                            <span className="font-mono text-blue-300 font-bold">
                                {formatTime(currentActivity.remainingSeconds)}
                            </span>
                        </div>

                        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/10 mb-3 relative z-10">
                            <motion.div 
                                className={`h-full ${currentActivity.isFinished ? 'bg-green-500' : 'bg-blue-500'}`}
                                initial={{ width: "0%" }}
                                animate={{ width: `${currentActivity.isFinished ? 100 : ((currentActivity.totalDuration - currentActivity.remainingSeconds) / currentActivity.totalDuration) * 100}%` }}
                                transition={{ ease: "linear" }}
                            />
                        </div>

                        {currentActivity.isFinished ? (
                            // 🛠️ CORRECTION 2 : relative z-20 cursor-pointer
                            <button 
                                onClick={handleClaim}
                                disabled={claiming}
                                className="relative z-20 cursor-pointer w-full py-3 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-wider rounded-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 hover:shadow-green-500/20"
                            >
                                {claiming ? "Récupération..." : <> <CheckCircle size={18}/> Récupérer la récompense </>}
                            </button>
                        ) : (
                            <p className="text-xs text-center text-slate-400 italic">Travail en cours...</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- LISTE DES ACTIVITÉS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                {activities.map((act) => {
                    const canAffordEnergy = joueur.energie_actuelle >= act.energie;
                    const canAffordBerrys = !act.cout_berrys || joueur.berrys >= act.cout_berrys;
                    const isDoable = canAffordEnergy && canAffordBerrys && !act.isOnCooldown && !currentActivity;

                    return (
                        <button
                            key={act.id}
                            onClick={() => isDoable && handleStart(act.id)}
                            disabled={!isDoable}
                            className={`relative p-3 rounded-xl border text-left transition-all duration-200 group overflow-hidden
                                ${isDoable 
                                    ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800 hover:border-white/20 active:scale-95 cursor-pointer' 
                                    : 'bg-slate-900/40 border-transparent opacity-60 cursor-not-allowed'
                                }
                            `}
                        >
                            {act.isOnCooldown && (
                                <div className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center rounded-xl backdrop-blur-[1px]">
                                    <Clock size={20} className="text-slate-500 mb-1"/>
                                    <span className="text-xs font-mono font-bold text-slate-400">{formatTime(act.cooldownSeconds)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className="text-2xl filter drop-shadow-md">{act.emoji}</span>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{act.duree < 60 ? `${act.duree}s` : `${Math.floor(act.duree/60)} min`}</span>
                                </div>
                            </div>
                            
                            <h4 className="font-bold text-slate-200 text-sm mb-1 relative z-10">{act.nom}</h4>
                            
                            <div className="flex items-center gap-3 text-xs relative z-10">
                                {act.energie > 0 && (
                                    <span className={`flex items-center gap-1 font-bold ${canAffordEnergy ? 'text-blue-400' : 'text-red-500'}`}>
                                        <Zap size={10} fill="currentColor" /> {act.energie}
                                    </span>
                                )}
                                {act.cout_berrys > 0 && (
                                    <span className={`flex items-center gap-1 font-bold ${canAffordBerrys ? 'text-yellow-400' : 'text-red-500'}`}>
                                        <Coins size={10} /> {act.cout_berrys} ฿
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* --- MODALE RECOMPENSE (Z-INDEX MAX) --- */}
            <AnimatePresence>
                {rewards && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center text-center p-4 backdrop-blur-md rounded-2xl"
                    >
                        <h3 className="text-2xl font-pirata text-yellow-400 mb-4 animate-bounce">Butin Récupéré !</h3>
                        <div className="flex flex-col gap-2 mb-6 w-full max-h-[150px] overflow-y-auto">
                            {rewards.map((r, i) => (
                                <div key={i} className="bg-white/10 px-4 py-2 rounded-lg text-white font-bold text-sm border border-white/5 shadow-sm">
                                    {r}
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => setRewards(null)}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold uppercase text-xs shadow-lg hover:shadow-blue-500/50 transition-all relative z-50 cursor-pointer"
                        >
                            Continuer
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActivityWidget;