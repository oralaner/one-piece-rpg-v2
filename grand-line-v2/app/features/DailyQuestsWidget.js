import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const DailyQuestsWidget = ({ userId, notify, theme }) => {
    const queryClient = useQueryClient();

    // 1. Récupération des quêtes
    const { data: quests, isLoading } = useQuery({
        queryKey: ['quests', userId],
        queryFn: () => api.get(`/game/quests/${userId}`),
        refetchOnWindowFocus: true,
        // On rafraîchit toutes les minutes pour voir l'avancement automatique si besoin
        refetchInterval: 60000 
    });

    // 2. Mutation pour réclamer
    const claimMutation = useMutation({
        mutationFn: (questId) => api.post('/game/quests/claim', { questId }), // userId est souvent géré par le JWT côté back
        onSuccess: (res) => {
            if (notify) notify(res.message || "Récompense récupérée !", "success");
            
            // 🔥 TRÈS IMPORTANT : On invalide tout pour mettre à jour l'XP/Berrys sur le profil
            queryClient.invalidateQueries(['quests', userId]);
            queryClient.invalidateQueries(['playerData']); 
        },
        onError: (err) => {
            const errorMsg = err.response?.data?.message || "Erreur lors de la récupération";
            if (notify) notify(errorMsg, "error");
        }
    });

    if (isLoading) return (
        <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 animate-pulse">
            <div className="h-4 w-32 bg-slate-700 rounded mb-4"></div>
            <div className="space-y-2">
                <div className="h-12 bg-slate-800 rounded"></div>
                <div className="h-12 bg-slate-800 rounded"></div>
            </div>
        </div>
    );

    const nbTermine = quests ? quests.filter(q => q.est_recupere).length : 0;
    const total = quests ? quests.length : 0;

    return (
        <div className={`p-4 rounded-2xl border-2 ${theme.border} bg-slate-900/80 backdrop-blur-md shadow-xl relative overflow-hidden`}>
            {/* Décoration de fond */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="text-6xl">📜</span>
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-2xl drop-shadow-md">📜</span>
                    <div>
                        <h3 className="text-lg font-black uppercase text-white font-pirata tracking-widest leading-none">Contrats du Jour</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Mise à jour quotidienne</p>
                    </div>
                </div>
                <div className={`text-xs font-black px-3 py-1 rounded-full border ${nbTermine === total ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black/40 border-white/10 text-yellow-500'}`}>
                    {nbTermine} / {total}
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                <AnimatePresence>
                    {quests && quests.length > 0 ? quests.map((q) => {
                        const progress = Math.min(100, (q.avancement / q.objectif) * 100);
                        
                        return (
                            <motion.div 
                                key={q.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`relative p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                                    q.est_recupere 
                                    ? 'border-slate-800 bg-slate-900/50 opacity-60 grayscale' 
                                    : q.est_termine 
                                        ? 'border-yellow-500 bg-yellow-900/10 shadow-[0_0_15px_rgba(234,179,8,0.15)]' 
                                        : 'border-slate-700/50 bg-slate-800/40'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className={`text-[11px] font-bold leading-tight ${q.est_recupere ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                        {q.description}
                                    </span>
                                    <div className="text-[10px] font-mono font-black text-white bg-black/60 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                                        {q.avancement} / {q.objectif}
                                    </div>
                                </div>

                                {/* Barre de progression */}
                                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className={`h-full transition-all duration-700 ${q.est_termine ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
                                    />
                                </div>

                                <div className="flex justify-between items-center mt-1">
                                    <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider">
                                        <span className="flex items-center gap-0.5 text-blue-400">✨ +{q.xp_reward}</span>
                                        <span className="flex items-center gap-0.5 text-yellow-500">💰 +{q.berrys_reward}</span>
                                    </div>

                                    {q.est_recupere ? (
                                        <div className="flex items-center gap-1 text-[9px] text-green-500 font-black uppercase">
                                            <span>TERMINÉ</span>
                                        </div>
                                    ) : q.est_termine ? (
                                        <button 
                                            onClick={() => claimMutation.mutate(q.id)}
                                            disabled={claimMutation.isLoading}
                                            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black uppercase rounded shadow-lg shadow-yellow-900/20 transform active:scale-95 transition-all animate-pulse"
                                        >
                                            {claimMutation.isLoading ? "..." : "RÉCLAMER"}
                                        </button>
                                    ) : (
                                        <span className="text-[9px] text-slate-500 font-bold italic opacity-50 uppercase">En cours</span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div className="py-8 text-center">
                            <p className="text-xs text-slate-500 italic">Aucun contrat disponible aujourd'hui.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DailyQuestsWidget;