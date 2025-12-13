import React, { useState } from 'react';
import { api } from '../utils/api';

const FactionSelector = ({ onSelect, userId }) => {
    const [loading, setLoading] = useState(false);
    const [pseudo, setPseudo] = useState(''); // ✅ État pour le pseudo
    const [step, setStep] = useState(1); // 1 = Choix Faction, 2 = Choix Pseudo

    const [selectedFaction, setSelectedFaction] = useState(null);

    // Étape 1 : Choisir la Faction
    const handleFactionSelect = (faction) => {
        setSelectedFaction(faction);
        setStep(2); // On passe au pseudo
    };

    // Étape 2 : Valider Création
    const handleCreate = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!pseudo || pseudo.length < 3) {
            alert("Le pseudo doit faire au moins 3 caractères !");
            return;
        }

        setLoading(true);
        try {
            // ✅ APPEL DE LA NOUVELLE ROUTE DE CRÉATION
            await api.post('/game/create', { 
                pseudo: pseudo, 
                faction: selectedFaction 
            });
            
            onSelect();
            window.location.reload();
        } catch (e) {
            alert("Erreur : " + (e.response?.data?.message || e.message));
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

    // RENDER ÉTAPE 2 : PSEUDO
    if (step === 2) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fadeIn">
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full text-center">
                    <h2 className="text-3xl font-black text-white font-pirata mb-6 tracking-widest">IDENTITÉ</h2>
                    
                    <p className="text-slate-400 text-sm mb-6">
                        Vous avez choisi la voie des <span className="font-bold text-yellow-500">{selectedFaction}s</span>.
                        <br/>Quel nom restera dans l'histoire ?
                    </p>

                    <form onSubmit={handleCreate}>
                        <input 
                            type="text" 
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            placeholder="Votre Pseudo..."
                            className="w-full bg-black/50 border border-slate-600 rounded-xl px-4 py-3 text-white font-bold text-center text-xl focus:border-yellow-500 outline-none mb-6 placeholder:text-slate-700"
                            autoFocus
                            maxLength={15}
                        />

                        <div className="flex gap-4">
                            <button 
                                type="button" 
                                onClick={() => setStep(1)} 
                                className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-slate-400 hover:bg-slate-700 transition"
                            >
                                RETOUR
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`flex-1 py-3 rounded-xl font-bold text-black transition transform active:scale-95 ${loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 shadow-lg shadow-yellow-500/20'}`}
                            >
                                {loading ? 'CRÉATION...' : 'COMMENCER'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // RENDER ÉTAPE 1 : FACTIONS
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
                        onClick={() => handleFactionSelect(f.id)}
                        disabled={loading}
                        className={`group relative h-80 rounded-2xl border-2 ${f.border} bg-gradient-to-br ${f.color} p-6 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden`}
                    >
                        {/* Overlay sombre au survol */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>

                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            {f.icon}
                        </div>
                        
                        <h2 className={`text-2xl font-black uppercase tracking-widest mb-4 font-pirata ${f.text}`}>
                            {f.title}
                        </h2>
                        
                        <p className="text-white/80 text-sm leading-relaxed font-medium">
                            {f.desc}
                        </p>

                        <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                            <span className="inline-block px-6 py-2 bg-white text-black font-bold uppercase text-xs tracking-widest rounded-full">
                                Rejoindre
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FactionSelector;