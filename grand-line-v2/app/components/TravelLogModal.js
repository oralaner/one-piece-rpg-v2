import React from 'react';
import { motion } from 'framer-motion';
import { Anchor, Wind, Ship, Sparkles } from 'lucide-react';

const TravelLogModal = ({ data, onClose }) => {
    if (!data) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border-2 border-yellow-600/50 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(202,138,4,0.2)]"
            >
                {/* Header Style "Vieux Parchemin" */}
                <div className="bg-gradient-to-b from-yellow-700/20 to-transparent p-6 text-center border-b border-white/5">
                    <div className="inline-flex p-3 bg-yellow-600/20 rounded-full mb-3 border border-yellow-500/30">
                        <Ship className="text-yellow-500" size={32} />
                    </div>
                    <h2 className="text-3xl font-pirata text-yellow-500 tracking-widest uppercase">Journal de Bord</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Rapport de Navigation</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Destination & Météo */}
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Destination</span>
                            <span className="text-lg font-black text-white">{data.destination}</span>
                        </div>
                        <div className="flex flex-col items-end text-right">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Climat rencontré</span>
                            <span className="text-lg flex items-center gap-2 font-bold text-blue-300">
                                {data.meteo_emoji} {data.meteo_nom}
                            </span>
                        </div>
                    </div>

                    {/* Événements marquants */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-2">
                            <Wind size={14} /> Faits marquants de la traversée
                        </h4>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {data.events && data.events.length > 0 ? data.events.map((event, i) => (
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={i} 
                                    className="flex items-center gap-3 text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-white/5"
                                >
                                    <Sparkles size={14} className="text-yellow-500 shrink-0" />
                                    {event}
                                </motion.div>
                            )) : (
                                <p className="text-xs text-slate-500 italic text-center py-4">Une traversée calme et sans encombre...</p>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-yellow-900/20"
                    >
                        VOIR LE BUTIN
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default TravelLogModal;