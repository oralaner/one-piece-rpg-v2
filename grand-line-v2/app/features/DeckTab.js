import React, { useState } from 'react';

// ✅ Ajout du prop 'joueur' pour vérifier son niveau
const DeckTab = ({ joueur, allSkills, mySkills, equippedSkills, onEquip, onBuy, theme }) => {
    const [filter, setFilter] = useState('TOUT');

    // --- SÉCURISATION & FILTRE TUTO ---
    const allSkillsSafe = allSkills || [];
    
    // 🔥 FILTRE TUTO : Si niveau < 5, on cache tout sauf les 2 skills de base
    const skills = allSkillsSafe.filter(skill => {
        // Si le joueur est niveau 5 ou plus, il voit tout
        if (joueur && joueur.niveau >= 5) return true;

        // Sinon (Tuto), il ne voit que "Direct du Droit" et "Tir Rapide"
        // On vérifie aussi si le joueur POSSÈDE déjà le skill (cas rare de bug/reset) pour ne pas le cacher
        const isOwned = (mySkills || []).some(ms => {
            const id = typeof ms === 'number' ? ms : (ms.competence_id || ms.id);
            return id === skill.id;
        });
        if (isOwned) return true; // Si je l'ai, je le vois

        const skillsTuto = ["Direct du Droit", "Tir Rapide"];
        return skillsTuto.includes(skill.nom);
    });

    const equippedIds = equippedSkills || [];
    const mySkillIds = (mySkills || []).map(item => {
        if (typeof item === 'number') return item;
        return item.competence_id || item.id;
    });

    // --- 1. DÉTECTION MULTI-TAGS ---
    const getTags = (skill) => {
        const rawType = (skill.type || skill.type_degats || "").toUpperCase();
        const name = (skill.nom || "").toUpperCase();
        const tags = [];

        // A. SOURCE DE POUVOIR
        const fruitTypes = ['FEU', 'GLACE', 'FOUDRE', 'ELASTIQUE', 'SPECIAL', 'TENEBRES', 'MAGMA', 'POISON'];
        if (fruitTypes.includes(rawType)) {
            tags.push({ label: 'FRUIT', icon: '🍎', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-900/40' });
        }
        if (rawType === 'HAKI') {
            tags.push({ label: 'HAKI', icon: '🌀', color: 'text-indigo-400', border: 'border-indigo-500/50', bg: 'bg-indigo-900/40' });
        }

        // B. TYPE D'ARME / PORTÉE
        const isDistance = rawType === 'DISTANCE' || name.includes('TIR') || name.includes('BALLE') || name.includes('SNIPER') || name.includes('CANON') || name.includes('ONDE');
        const isWeapon = name.includes('SABRE') || name.includes('LAME') || name.includes('EPEE') || name.includes('COUPE') || name.includes('ESTOCADE') || name.includes('SLASH');

        if (isDistance) {
            tags.push({ label: 'DIST', icon: '🔫', color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-900/40' });
        } else if (isWeapon) {
            tags.push({ label: 'ARME', icon: '⚔️', color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-900/40' });
        } else {
            tags.push({ label: 'C-A-C', icon: '👊', color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-900/40' });
        }

        return tags;
    };

    // --- 2. STYLE PRINCIPAL ---
    const getPrimaryStyle = (skill) => {
        const rawType = (skill.type || "").toUpperCase();
        if (['FEU', 'GLACE', 'FOUDRE', 'ELASTIQUE', 'SPECIAL'].includes(rawType)) return 'purple';
        if (rawType === 'HAKI') return 'indigo';
        if (rawType === 'DISTANCE') return 'emerald';
        if (skill.nom.toUpperCase().includes('SABRE')) return 'amber';
        return 'red'; 
    };

    // --- 3. FILTRAGE ---
    const filteredSkills = skills.filter(skill => {
        const tags = getTags(skill).map(t => t.label);
        
        if (filter === 'TOUT') return true;
        if (filter === 'MELEE') return tags.includes('C-A-C');
        if (filter === 'ARME') return tags.includes('ARME');
        if (filter === 'DISTANCE') return tags.includes('DIST');
        if (filter === 'HAKI') return tags.includes('HAKI');
        if (filter === 'FRUIT') return tags.includes('FRUIT');
        return true;
    });

    const FILTERS = [
        { id: 'TOUT', label: 'Tout' },
        { id: 'MELEE', label: '👊 C-A-C' },
        { id: 'ARME', label: '⚔️ Arme' },
        { id: 'DISTANCE', label: '🔫 Distance' },
        { id: 'HAKI', label: '🌀 Haki' },
        { id: 'FRUIT', label: '🍎 Fruit' },
    ];

    return (
        <div className="space-y-8 animate-fadeIn pb-10 pt-2">

            {/* --- DECK ACTIF --- */}
            <div className={`rounded-3xl p-6 border-b-4 shadow-2xl relative overflow-hidden ${theme.panel}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
                <div className="relative z-10 text-center mb-4">
                    <h3 className="text-xl font-black uppercase text-white font-pirata tracking-widest drop-shadow-md">
                        Deck de Combat <span className="text-yellow-500 text-lg">({equippedIds.length}/5)</span>
                    </h3>
                </div>
                <div className="flex justify-center gap-3 md:gap-6 flex-wrap relative z-10">
                    {equippedIds.map(id => {
                        // On cherche dans allSkillsSafe car skills est filtré
                        const skill = allSkillsSafe.find(c => c.id === id);
                        if (!skill) return null;
                        
                        const color = getPrimaryStyle(skill);
                        const tags = getTags(skill);

                        return (
                            <div key={id} onClick={() => onEquip(id)} className={`relative w-20 h-28 md:w-24 md:h-36 rounded-xl border-2 border-${color}-500/50 bg-${color}-900/20 flex flex-col items-center justify-between p-2 cursor-pointer group transition-all hover:scale-105 hover:shadow-lg hover:brightness-110`}>
                                <div className="absolute -top-2 -right-2 bg-slate-900 border border-slate-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-20 shadow-md">{skill.puissance}</div>
                                <div className="flex-1 flex items-center justify-center text-3xl drop-shadow-md">{tags[0]?.icon || '⚔️'}</div>
                                <p className={`text-[8px] md:text-[9px] font-black uppercase leading-tight text-${color}-400 text-center line-clamp-2`}>{skill.nom}</p>
                            </div>
                        );
                    })}
                    {[...Array(Math.max(0, 5 - equippedIds.length))].map((_, i) => (
                        <div key={`empty-${i}`} className="w-20 h-28 md:w-24 md:h-36 rounded-xl border-2 border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center"><span className="text-white/20 text-xl">+</span></div>
                    ))}
                </div>
            </div>

            {/* --- GRIMOIRE --- */}
            <div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 px-2">
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">Grimoire</h3>
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10 overflow-x-auto max-w-full no-scrollbar gap-1">
                        {FILTERS.map(f => (
                            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase whitespace-nowrap transition-all border ${filter === f.id ? 'bg-white text-slate-900 border-white shadow-md scale-105' : 'bg-transparent text-slate-500 border-transparent hover:text-white hover:bg-white/5'}`}>{f.label}</button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSkills.map(skill => {
                        const possede = mySkillIds.includes(skill.id);
                        const equipe = equippedIds.includes(skill.id);
                        
                        const color = getPrimaryStyle(skill);
                        const tags = getTags(skill);

                        const description = skill.description || "";
                        const shortDesc = description.length > 60 ? description.substring(0, 60) + "..." : description;

                        if (skill.exclusif_pnj && !possede) return null;

                        return (
                            <div key={skill.id} className={`relative flex items-stretch rounded-xl border overflow-hidden transition-all ${possede ? `bg-slate-900 border-slate-700 hover:border-slate-500` : 'bg-slate-950 border-slate-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}`}>
                                <div className={`w-14 flex flex-col items-center justify-center gap-1 ${possede ? `bg-${color}-900/20` : 'bg-slate-900'} border-r border-white/5`}>
                                    <span className="text-2xl">{tags[0]?.icon}</span>
                                </div>

                                <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-black text-sm uppercase truncate ${theme.textMain}`}>{skill.nom}</h4>
                                        {possede && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 font-mono">{skill.puissance} Pui</span>}
                                    </div>

                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {tags.map((t, i) => (
                                            <span key={i} className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${t.color} ${t.border} ${t.bg}`}>
                                                {t.label}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <p className="text-[10px] text-slate-400 italic leading-tight my-1 line-clamp-2">{shortDesc}</p>

                                    <div className="flex items-center gap-3 mt-auto pt-1">
                                        <span className={`text-[9px] font-bold ${skill.precision >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>🎯 {skill.precision}%</span>
                                        {!possede && skill.est_achetable && <span className="text-[9px] font-bold text-yellow-500">💰 {skill.cout_achat?.toLocaleString() || 0}</span>}
                                    </div>
                                </div>

                                <div className="w-24 border-l border-white/5 p-2 flex flex-col justify-center">
                                    {possede ? (
                                        equipe ? (
                                            <button onClick={() => onEquip(skill.id)} className="w-full h-full rounded-lg bg-slate-800 border border-slate-600 text-slate-400 font-bold text-[10px] uppercase hover:bg-red-900/50 hover:text-red-400 hover:border-red-500 transition">Retirer</button>
                                        ) : (
                                            <button onClick={() => onEquip(skill.id)} className={`w-full h-full rounded-lg font-bold text-[10px] uppercase shadow-lg active:scale-95 transition ${theme.btnPrimary}`} disabled={equippedIds.length >= 5}>{equippedIds.length >= 5 ? 'Plein' : 'Équiper'}</button>
                                        )
                                    ) : (
                                        skill.est_achetable ? (
                                            <button onClick={() => onBuy(skill.id)} className="w-full h-full rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase shadow-lg active:scale-95 transition flex flex-col items-center justify-center leading-tight"><span>Acheter</span></button>
                                        ) : (
                                            <div className="w-full h-full rounded-lg bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-slate-600"><span className="text-lg">🔒</span></div>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- MESSAGE TUTO (si niveau < 5) --- */}
                {joueur && joueur.niveau < 5 && (
                    <div className="mt-8 p-6 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 text-center">
                        <div className="text-3xl mb-2 opacity-50">🔒</div>
                        <h4 className="text-slate-400 font-bold uppercase text-sm mb-1">Entraînement Avancé Verrouillé</h4>
                        <p className="text-slate-600 text-xs italic">
                            Atteins le <span className="text-yellow-500 font-bold">Niveau 5</span> pour découvrir d'autres techniques de combat.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeckTab;