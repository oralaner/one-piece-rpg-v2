import React, { useState } from 'react';
import { api } from '../utils/api';

const FactionSelector = ({ onSelect, userId }) => {
    const [loading, setLoading] = useState(false);

    const handleChoose = async (faction) => {
        console.log("🔵 FACTION SELECTOR V5 - Click détecté sur", faction);
        
        if (loading) return;
        setLoading(true);

        try {
            // 1. Appel API
            console.log("📡 Envoi requête backend...");
            await api.post('/game/faction/choose', { userId, faction });
            console.log("✅ Réponse backend OK.");

            // 2. Message utilisateur (pour être sûr que ça ne va pas trop vite)
            alert(`Bienvenue chez les ${faction}s ! La page va se recharger.`);

            // 3. RELOAD FORCÉ "HARD"
            // On utilise window.location.href pour forcer le navigateur à tout redemander
            window.location.href = window.location.href;

        } catch (e) {
            console.error("❌ Erreur:", e);
            alert("Erreur : " + (e.response?.data?.message || e.message));
            setLoading(false);
        }
    };

    const factions = [
        { id: 'Pirate', icon: '☠️', title: 'Pirate', desc: 'Liberté et Richesse', color: 'from-red-900 to-red-600', border: 'border-red-500', text: 'text-red-100' },
        { id: 'Marine', icon: '⚖️', title: 'Marine', desc: 'Ordre et Justice', color: 'from-cyan-900 to-cyan-600', border: 'border-cyan-400', text: 'text-cyan-100' },
        { id: 'Révolutionnaire', icon: '🔥', title: 'Révolutionnaire', desc: 'Changement et Combat', color: 'from-emerald-900 to-emerald-600', border: 'border-emerald-500', text: 'text-emerald-100' }
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fadeIn">
            <h1 className="text-4xl text-yellow-500 font-pirata mb-8">CHOISIS TA FACTION (V5)</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {factions.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => handleChoose(f.id)}
                        disabled={loading}
                        className={`h-64 rounded-xl border-2 ${f.border} bg-gradient-to-br ${f.color} p-4 flex flex-col items-center justify-center hover:scale-105 transition-transform`}
                    >
                        <div className="text-6xl mb-4">{f.icon}</div>
                        <h2 className={`text-2xl font-black ${f.text}`}>{f.title}</h2>
                        <p className="text-white/80 text-sm mt-2">{f.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FactionSelector;