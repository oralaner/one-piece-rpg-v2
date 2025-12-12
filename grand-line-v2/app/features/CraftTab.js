import React, { useState } from 'react';
import { getRareteConfig } from '../utils/gameUtils';

const CraftTab = ({ recettes, inventaire, onCraft, theme, itemDefinitions, niveauJoueur = 1 }) => {
    const [craftCategory, setCraftCategory] = useState(null);

    const getQtePossedee = (idItem) => {
        const id = parseInt(idItem); 
        const item = inventaire.find(x => x.objet_id === id);
        return item ? item.quantite : 0;
    };
    
    const getItemDetails = (idItem) => {
        if (!itemDefinitions) return null;
        const id = parseInt(idItem);
        return itemDefinitions.find(obj => obj.id === id);
    };

    const professions = [
        { id: 'Forge', icon: '🔨', label: 'Forge', desc: 'Armes & Armures', color: 'text-orange-500', bg: 'bg-orange-300/20', border: 'border-orange-500/50' },
        { id: 'Menuiserie', icon: '🪚', label: 'Menuiserie', desc: 'Bateaux & Coffres', color: 'text-yellow-500', bg: 'bg-yellow-300/20', border: 'border-yellow-500/50' },
        { id: 'Alchimie', icon: '⚗️', label: 'Alchimie', desc: 'Potions & Elixirs', color: 'text-purple-500', bg: 'bg-purple-300/20', border: 'border-purple-500/50' },
        { id: 'Cuisine', icon: '🍳', label: 'Cuisine', desc: 'Plats & Bonus', color: 'text-green-500', bg: 'bg-green-300/20', border: 'border-green-500/50' },
        { id: 'Tissage', icon: '🧵', label: 'Tissage', desc: 'Capes & Voiles', color: 'text-cyan-500', bg: 'bg-cyan-300/20', border: 'border-cyan-500/50' },
    ];

    return (
        <div className="space-y-6 animate-fadeIn pb-10 pt-2">
            
            {/* HEADER */}
            <div className={`p-5 rounded-2xl border-b-4 shadow-xl relative overflow-hidden ${theme.btnPrimary}`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="relative z-10 text-center">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white font-pirata drop-shadow-md">Atelier d'Artisanat</h2>
                    <p className="text-xs opacity-90 font-bold uppercase tracking-wide">Fabriquez votre équipement légendaire</p>
                </div>
            </div>

            {!craftCategory ? (
                // VUE 1 : CHOIX MÉTIER
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {professions.map((metier) => (
                        <button 
                            key={metier.id}
                            onClick={() => setCraftCategory(metier.id)}
                            className={`relative p-6 rounded-2xl border-2 ${metier.border} ${metier.bg} hover:bg-slate-800 transition-all duration-300 group flex flex-col items-center gap-3 shadow-lg hover:scale-[1.02] hover:shadow-${metier.color}/20`}
                        >
                            <div className="w-16 h-16 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-inner">
                                {metier.icon}
                            </div>
                            <div className="text-center">
                                <span className={`font-black uppercase text-lg block ${metier.color} font-pirata tracking-wide`}>{metier.label}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{metier.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                // VUE 2 : LISTE RECETTES
                <div className="space-y-4">
                    <button onClick={() => setCraftCategory(null)} className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white transition group w-fit px-2 py-1 rounded hover:bg-white/5">
                        <span className="group-hover:-translate-x-1 transition-transform">⬅</span> Retour aux métiers
                    </button>

                    {recettes.filter(r => (r.categorie || "").toLowerCase() === craftCategory.toLowerCase()).length === 0 ? (
                        <div className="text-center py-16 opacity-50 flex flex-col items-center">
                            <span className="text-4xl mb-2">📜</span>
                            <p className="italic text-slate-400">Vous ne connaissez aucune recette...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {recettes
                                .filter(r => (r.categorie || "").toLowerCase() === craftCategory.toLowerCase())
                                .sort((a, b) => {
                                    // Tri : Débloqués en premier, puis par niveau croissant
                                    const aLocked = (a.niveau_requis || 1) > niveauJoueur;
                                    const bLocked = (b.niveau_requis || 1) > niveauJoueur;
                                    if (aLocked !== bLocked) return aLocked ? 1 : -1;
                                    return (a.niveau_requis || 1) - (b.niveau_requis || 1);
                                })
                                .map((recette, i) => {
                                    const niveauRequis = recette.niveau_requis || 1;
                                    const isLocked = niveauJoueur < niveauRequis;

                                    // --- 🔒 CAS 1 : RECETTE VERROUILLÉE (MYSTÈRE) ---
                                    if (isLocked) {
                                        return (
                                            <div key={i} className="relative bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-inner flex flex-col items-center justify-center text-center gap-4 opacity-80 group hover:opacity-100 transition-opacity border-dashed">
                                                
                                                {/* Icône Cadenas */}
                                                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl mb-2">
                                                    🔒
                                                </div>

                                                <div className="space-y-1">
                                                    <h3 className="font-black text-slate-600 text-lg tracking-widest uppercase filter blur-[1px]">RECETTE INCONNUE</h3>
                                                    <div className="inline-block bg-red-900/30 border border-red-900/50 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full">
                                                        Niveau {niveauRequis} Requis
                                                    </div>
                                                </div>

                                                {/* Faux ingrédients floutés pour le style */}
                                                <div className="w-full max-w-[200px] space-y-2 opacity-20 mt-2">
                                                    <div className="h-2 bg-slate-500 rounded-full w-3/4 mx-auto"></div>
                                                    <div className="h-2 bg-slate-500 rounded-full w-1/2 mx-auto"></div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // --- 🔓 CAS 2 : RECETTE DÉBLOQUÉE (NORMALE) ---
                                    const rareteConfig = recette.objets ? getRareteConfig(recette.objets.rarete) : { border: 'border-slate-600', text: 'text-slate-400' };
                                    
                                    // Vérification ressources
                                    let hasResources = true;
                                    const ingredientsList = Array.isArray(recette.ingredients) ? recette.ingredients : [];
                                    ingredientsList.forEach(ing => {
                                        if (getQtePossedee(ing.objet_ingredient_id) < ing.quantite) hasResources = false;
                                    });

                                    return (
                                        <div key={i} className={`relative bg-slate-900/90 border-l-4 ${rareteConfig.border} border-y border-r border-slate-700/50 p-4 rounded-r-xl rounded-l-sm shadow-xl flex flex-col gap-4 group transition-all hover:border-r-white/20`}>
                                            
                                            {/* En-tête */}
                                            <div className="flex items-start gap-4 pb-4 border-b border-white/5">
                                                <div className="relative w-16 h-16 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                                    {recette.objets?.image_url ? (
                                                        <img src={recette.objets.image_url} className="w-full h-full object-contain p-1" alt={recette.nom} />
                                                    ) : <span className="text-3xl">🛠️</span>}
                                                    
                                                    {/* Badge Niveau */}
                                                    <div className="absolute -top-2 -right-2 bg-slate-900 border border-slate-600 text-[9px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                                                        Niv.{niveauRequis}
                                                    </div>
                                                </div>
                                                
                                                <div className="min-w-0">
                                                    <h3 className={`font-black text-lg truncate ${theme.textMain} font-pirata tracking-wide`}>
                                                        {recette.nom.replace('Recette : ', '')}
                                                    </h3>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${rareteConfig.text} opacity-80`}>
                                                        {recette.objets?.rarete || 'Commun'} • {recette.objets?.type_equipement || 'Objet'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-1">
                                                        {recette.objets?.description || "Résultat de fabrication"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Ingrédients */}
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Matériaux Requis</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {ingredientsList.map((ing) => {
                                                        const idItem = ing.objet_ingredient_id;
                                                        const qteReq = ing.quantite;
                                                        const possede = getQtePossedee(idItem);
                                                        const aAssez = possede >= qteReq;
                                                        const ingredient = ing.objet || getItemDetails(idItem);
                                                        const ingredientRarity = ingredient ? getRareteConfig(ingredient.rarete) : { border: 'border-slate-600' };
                                                        
                                                        return (
                                                            <div key={idItem} className={`flex items-center gap-2 p-1.5 rounded-lg border transition-colors ${aAssez ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                                                                <div className={`w-8 h-8 rounded bg-slate-950 flex items-center justify-center shrink-0 text-xs border ${ingredientRarity.border} p-0.5`}>
                                                                    {ingredient?.image_url ? <img src={ingredient.image_url} className="w-full h-full object-contain" /> : <span>❓</span>}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex justify-between items-baseline">
                                                                        <span className="text-[9px] text-white uppercase font-bold truncate">{ingredient?.nom || `#${idItem}`}</span>
                                                                        <span className={`text-[9px] font-black font-mono ${aAssez ? 'text-green-400' : 'text-red-400'}`}>{possede}/{qteReq}</span>
                                                                    </div>
                                                                    <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                                                                        <div className={`h-full ${aAssez ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (possede/qteReq)*100)}%` }}></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Bouton Action */}
                                            <button 
                                                onClick={() => hasResources && onCraft(recette)}
                                                disabled={!hasResources}
                                                className={`w-full py-3 rounded-lg font-black uppercase shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-auto
                                                ${hasResources 
                                                    ? `${theme.btnPrimary} hover:brightness-110` 
                                                    : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-80'}`}
                                            >
                                                {hasResources ? (
                                                    <><span>🔨</span> FABRIQUER</>
                                                ) : (
                                                    <span className="text-[10px]">MANQUE DES RESSOURCES</span>
                                                )}
                                            </button>

                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CraftTab;