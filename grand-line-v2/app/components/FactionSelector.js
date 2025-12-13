import React, { useState } from 'react';
import { api } from '../utils/api';

const FactionSelector = ({ onSelect, userId }) => {
    const [loading, setLoading] = useState(false);

    const handleChoose = async (faction) => {
        if (loading) return;
        setLoading(true);
        try {
            // ✅ Appel simple à l'ancienne route
            await api.post('/game/faction/choose', { userId, faction });
            
            onSelect(); 
            window.location.reload();
        } catch (e) {
            alert("Erreur lors du choix : " + (e.response?.data?.message || e.message));
            setLoading(false);
        }
    };

    const factions = [
        {
            id: 'Pirate',
            icon: '☠️',
            title: 'Pirate',
            desc: 'La liberté avant tout. Cherchez le One Piece et amassez des richesses.',
            color: 'from-red-900 to-red-600',
            border: 'border-red-500',
            text: 'text-red-100'
        },
        {
            id: 'Marine',
            icon: '⚖️',
            title: 'Marine',
            desc: 'La Justice absolue. Maintenez l\'ordre et chassez les criminels.',
            color: 'from-cyan-900 to-cyan-600',
            border: 'border-cyan-400',
            text: 'text-cyan-100'
        },
        {
            id: 'Révolutionnaire',
            icon: '🔥',
            title: 'Révolutionnaire',
            desc: 'Renversez le monde. Combattez le Gouvernement Mondial dans l\'ombre.',
            color: 'from-emerald-900 to-emerald-600',
            border: 'border-emerald-500',
            text: 'text-emerald-100'
        }
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fadeIn">
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-black text-yellow-500 font-pirata tracking-widest drop-shadow-lg mb-2">
                    CHOISISSEZ VOTRE VOIE
                </h1>
                <p className="text-slate-400 text-sm md:text-base uppercase tracking-wider">
                    Cette décision est définitive et façonnera votre destin.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {factions.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => handleChoose(f.id)}
                        disabled={loading}
                        className={`group relative h-80 rounded-2xl border-2 ${f.border} bg-gradient-to-br ${f.color} p-6 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden`}
                    >
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                        <h2 className={`text-2xl font-black uppercase tracking-widest mb-4 font-pirata ${f.text}`}>{f.title}</h2>
                        <p className="text-white/80 text-sm leading-relaxed font-medium">{f.desc}</p>
                        <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                            <span className="inline-block px-6 py-2 bg-white text-black font-bold uppercase text-xs tracking-widest rounded-full">Rejoindre</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FactionSelector;