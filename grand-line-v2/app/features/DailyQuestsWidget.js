import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

const DailyQuestsWidget = ({ userId, notify, theme }) => {
    const queryClient = useQueryClient();

    const { data: quests, isLoading } = useQuery({
        queryKey: ['quests', userId],
        queryFn: () => api.get(`/game/quests/${userId}`),
        refetchOnWindowFocus: true
    });

    const claimMutation = useMutation({
        mutationFn: (questId) => api.post('/game/quests/claim', { userId, questId }),
        onSuccess: (res) => {
            if (notify) notify(res.message, "success");
            queryClient.invalidateQueries(['quests', userId]);
            queryClient.invalidateQueries(['playerData']);
        },
        onError: (err) => {
            if (notify) notify(err.message, "error");
        }
    });

    if (isLoading) return <div className="p-4 text-center text-xs text-slate-500 animate-pulse">Chargement...</div>;

    const nbTermine = quests ? quests.filter(q => q.est_recupere).length : 0;
    const total = quests ? quests.length : 0;

    return (
        <div className={`p-4 rounded-2xl border-2 ${theme.border} bg-slate-900/80 backdrop-blur-sm shadow-xl relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📜</span>
                    <div>
                        <h3 className="text-lg font-black uppercase text-white font-pirata tracking-widest leading-none">Contrats du Jour</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Reset à minuit</p>
                    </div>
                </div>
                <div className="text-xs font-black bg-black/40 px-3 py-1 rounded-full border border-white/10 text-yellow-500">
                    {nbTermine} / {total}
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                {quests && quests.length > 0 ? quests.map((q) => (
                    <div key={q.id} className={`relative p-3 rounded-xl border flex flex-col gap-2 transition-all ${q.est_recupere ? 'border-slate-800 bg-slate-800/30 opacity-50 grayscale' : q.est_termine ? 'border-yellow-500 bg-yellow-900/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-slate-700 bg-slate-800/50'}`}>
                        <div className="flex justify-between items-start">
                            <span className={`text-xs font-bold ${q.est_recupere ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {q.description}
                            </span>
                            <div className="text-[9px] font-mono font-black text-white bg-black/50 px-1.5 py-0.5 rounded border border-white/10">
                                {q.avancement}/{q.objectif}
                            </div>
                        </div>
                        <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                            <div className={`h-full transition-all duration-500 ${q.est_termine ? 'bg-yellow-400' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (q.avancement / q.objectif) * 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mt-1 h-6">
                            <div className="flex gap-2 text-[9px] font-bold opacity-80">
                                <span className="text-blue-300">+{q.xp_reward} XP</span>
                                <span className="text-yellow-300">+{q.berrys_reward} ฿</span>
                            </div>
                            {q.est_recupere ? (
                                <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider">✔ Complété</span>
                            ) : q.est_termine ? (
                                <button onClick={() => claimMutation.mutate(q.id)} className="px-3 py-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black text-[9px] font-black uppercase rounded shadow-lg animate-pulse transform active:scale-95 transition">
                                    RÉCLAMER !
                                </button>
                            ) : (
                                <span className="text-[9px] text-slate-500 italic">En cours...</span>
                            )}
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-xs text-slate-500 italic">Aucune quête disponible.</p>
                )}
            </div>
        </div>
    );
};

export default DailyQuestsWidget;