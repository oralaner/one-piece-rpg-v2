import React, { useEffect, useRef, useState } from 'react';
import BattleResult from '../components/BattleResult';

const CombatTab = ({ 
    session, joueur, combatSession, opponent, monPerso, 
    combatLog, combatRewards, onAttack, onFlee, onQuit, theme, competences 
}) => {
    
    // État pour la fenêtre de confirmation de fuite
    const [showFleeModal, setShowFleeModal] = useState(false);
    
    // 🔥 ÉTAT ANTI-SPAM (Nouveau)
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Auto-scroll des logs vers le bas
    const bottomLogRef = useRef(null);
    useEffect(() => {
        bottomLogRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [combatLog]);

    // 🔥 DÉVERROUILLAGE ANTI-SPAM
    // Dès que les logs changent (le serveur a répondu), on débloque les boutons
    useEffect(() => {
        setIsActionLoading(false);
    }, [combatLog]);

    // 🔥 HANDLER D'ATTAQUE SÉCURISÉ
    const handleAttackClick = (skillId) => {
        if (isActionLoading) return; // Bloque si déjà en cours
        setIsActionLoading(true); // Verrouille
        onAttack(skillId); // Envoie la requête
        
        // Sécurité : Déverrouille auto après 2s si le serveur lagge
        setTimeout(() => setIsActionLoading(false), 2000); 
    };

    // --- 1. LOGIQUE DE VÉRIFICATION D'ÉQUIPEMENT ---
    const checkSkillUsability = (skill) => {
        if (!skill) return { usable: false, reason: "Inconnu" };

        const equipArme = joueur.equipement?.arme;
        const nomArme = (equipArme?.nom || equipArme?.objets?.nom || "").toUpperCase();
        const nomSkill = skill.nom.toUpperCase();
        const typeSkill = (skill.type_degats || skill.type || "").toUpperCase();

        const KW_SKILL_SWORD = ["COUPE", "ESTOCADE", "LAME", "SABRE", "CHASSEUR", "TOURBILLON", "CHANT", "TROIS", "KAMUSARI", "SLASH", "ZORO", "ONIGIRI"];
        const KW_ITEM_SWORD  = ["SABRE", "ÉPÉE", "EPEE", "KATANA", "LAME", "DAGUE", "COUTEAU", "YORU", "WADO", "KITETSU"];
        
        const KW_SKILL_GUN   = ["TIR", "BALLE", "RAFALE", "CANON", "SNIPER", "PLOMB", "EXPLOSIVE", "MOUSQUET", "PRÉCISION", "MITRAIL"];
        const KW_ITEM_GUN    = ["PISTOLET", "FUSIL", "LANCE", "CANON", "SNIPER", "MOUSQUET", "REVOLVER", "BAZOOKA", "ARC", "ARBALÈTE", "FLINGUE", "BASIQUE"];
        
        const FRUIT_TYPES    = ['FEU', 'GLACE', 'FOUDRE', 'ELASTIQUE', 'SPECIAL', 'MAGMA', 'LUMIERE', 'TENEBRES', 'GRAVITE', 'POISON', 'OP'];

        if (FRUIT_TYPES.includes(typeSkill)) return { usable: true, reason: "" };

        if (KW_SKILL_SWORD.some(k => nomSkill.includes(k))) {
            const hasSword = KW_ITEM_SWORD.some(k => nomArme.includes(k));
            if (!hasSword) return { usable: false, reason: "Il faut une Épée !" };
            return { usable: true, reason: "" };
        }

        if (typeSkill === 'DISTANCE' || KW_SKILL_GUN.some(k => nomSkill.includes(k))) {
            const hasGun = KW_ITEM_GUN.some(k => nomArme.includes(k));
            if (!hasGun) return { usable: false, reason: "Il faut une Arme à distance !" };
            return { usable: true, reason: "" };
        }

        return { usable: true, reason: "" };
    };

    // --- 2. GESTION FIN DE COMBAT ---
    if (combatRewards || combatSession?.termine) {
        const result = combatRewards || {
            etat: combatSession?.pv_joueur_actuel > 0 ? 'VICTOIRE' : 'DEFAITE',
            gain_xp: 0, gain_berrys: 0, gain_elo: 0, pv_perdus: 0,
            pv_moi: combatSession?.pv_joueur_actuel || 0
        };
        return <BattleResult result={result} onClose={onQuit} />;
    }

    // --- 3. COMPOSANT BARRE DE VIE ---
    const HealthBar = ({ current, max, isEnemy, name }) => {
        const safeMax = max || 100;
        const safeCurrent = Math.max(0, current);
        const percent = Math.max(0, Math.min(100, (safeCurrent / safeMax) * 100));
        
        let color = "bg-emerald-500";
        if (percent < 50) color = "bg-yellow-500";
        if (percent < 20) color = "bg-red-600";

        return (
            <div className={`flex flex-col ${isEnemy ? 'items-end' : 'items-start'} w-48 md:w-64`}>
                <div className="flex justify-between w-full text-xs font-black uppercase mb-1 px-1 text-white shadow-black drop-shadow-md">
                    <span className={isEnemy ? "text-red-400" : "text-blue-300"}>{name}</span>
                    <span className="font-mono text-[10px] opacity-80">{safeCurrent}/{safeMax}</span>
                </div>
                <div className="w-full h-4 bg-slate-900/90 border-2 border-slate-600 rounded-lg overflow-hidden relative shadow-xl transform skew-x-[-10deg]">
                    <div className="absolute top-0 left-0 h-full bg-red-900 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }}></div>
                    <div className={`absolute top-0 left-0 h-full ${color} transition-all duration-300 ease-out shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden bg-slate-950 rounded-xl border border-slate-800 shadow-2xl">
            
            {/* --- DÉCOR / FOND --- */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-black z-0"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] z-0"></div>

            {/* --- MODALE D'ABANDON --- */}
            {showFleeModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border-2 border-red-500 rounded-2xl p-6 max-w-xs w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-popIn">
                        <div className="text-4xl mb-4">🏳️</div>
                        <h3 className="text-xl font-black text-white uppercase mb-2">Abandonner ?</h3>
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                            Fuir comptera comme une <span className="text-red-400 font-bold">DÉFAITE</span> et tu perdras la moitié de tes PV restants.
                        </p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowFleeModal(false)}
                                className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold uppercase hover:bg-slate-700 transition"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={() => {
                                    setShowFleeModal(false);
                                    onFlee(); 
                                }}
                                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold uppercase hover:bg-red-700 transition shadow-lg"
                            >
                                Fuir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SCÈNE DE COMBAT --- */}
            <div className="flex-1 relative z-10 w-full h-full">
                
                {/* 1. ADVERSAIRE */}
                <div className="absolute top-6 right-4 md:right-10 flex items-center gap-4 animate-slideInRight">
                    <HealthBar 
                        current={combatSession.pv_adversaire_actuel} 
                        max={combatSession.pv_max_adversaire || opponent?.pv_max} 
                        name={opponent?.pseudo || "Adversaire"} 
                        isEnemy 
                    />
                    <div className="relative group">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-red-900 shadow-[0_0_30px_rgba(220,38,38,0.5)] overflow-hidden bg-black relative z-10">
                            <img src={opponent?.avatar_url || "https://cdn-icons-png.flaticon.com/512/4322/4322991.png"} className="w-full h-full object-cover" alt="Ennemi" />
                        </div>
                        <div className="absolute -inset-2 bg-red-600/30 rounded-full blur-xl animate-pulse"></div>
                    </div>
                </div>

                {/* 2. JOUEUR */}
                <div className="absolute bottom-4 left-4 md:left-10 flex items-center gap-4 animate-slideInLeft">
                    <div className="relative group">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-cyan-600 shadow-[0_0_30px_rgba(6,182,212,0.5)] overflow-hidden bg-black relative z-10">
                            {joueur.avatar_url ? <img src={joueur.avatar_url} className="w-full h-full object-cover" alt="Moi" /> : <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>}
                        </div>
                        <div className="absolute -inset-2 bg-cyan-600/30 rounded-full blur-xl animate-pulse"></div>
                    </div>
                    <HealthBar 
                        current={combatSession.pv_joueur_actuel} 
                        max={combatSession.pv_max_joueur || monPerso?.pv_max} 
                        name={joueur.pseudo} 
                    />
                </div>

                {/* --- JOURNAL DE COMBAT --- */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 flex flex-col items-center justify-center pointer-events-none z-0">
                    <div className="space-y-2 w-full flex flex-col items-center">
                        {combatLog && combatLog.slice(-5).map((log, i) => { 
                            const isLast = i === combatLog.slice(-5).length - 1; 
                            const isPlayer = log.includes('Tu utilises') || log.includes('Attaque :');
                            return (
                                <div key={i} className={`transition-all duration-300 w-fit max-w-full ${isLast ? 'scale-110 opacity-100 translate-y-0' : 'scale-90 opacity-60 -translate-y-2 blur-[1px]'}`}>
                                    <div className={`px-4 py-1.5 rounded-lg border-2 shadow-2xl backdrop-blur-md font-bold uppercase tracking-wide text-xs md:text-sm text-center ${isPlayer ? 'bg-blue-900/80 border-blue-400 text-blue-100' : 'bg-red-900/80 border-red-500 text-red-100'}`}>
                                        {log}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomLogRef} />
                    </div>
                </div>
            </div>

            {/* --- BARRE D'ACTIONS --- */}
            <div className="bg-slate-900 border-t-4 border-slate-700 p-2 z-30 shadow-[0_-10px_50px_rgba(0,0,0,0.8)]">
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 px-2 pb-2 max-w-3xl mx-auto">
                    {(joueur.deck_combat || []).slice(0, 5).map((skillId) => {
                        const skill = competences.find(c => c.id === skillId);
                        
                        if (!skill) return <div key={Math.random()} className="bg-slate-800/30 rounded-xl h-20 border border-white/5 animate-pulse"></div>;
                        
                        const { usable, reason } = checkSkillUsability(skill);
                        const isPhys = !['FEU', 'GLACE', 'FOUDRE', 'HAKI', 'DISTANCE'].some(t => (skill.type_degats || "").toUpperCase().includes(t));

                        // 🔥 DÉSACTIVATION SI NON UTILISABLE OU EN COURS DE CHARGEMENT
                        const isDisabled = !usable || isActionLoading;

                        return (
                            <button 
                                key={skillId}
                                // 👇 Appel sécurisé via handleAttackClick
                                onClick={() => !isDisabled && handleAttackClick(skillId)}
                                disabled={isDisabled}
                                className={`relative h-20 px-3 py-2 rounded-xl border-b-4 flex flex-col justify-between items-start transition-all shadow-lg group overflow-hidden
                                ${isDisabled 
                                    ? 'bg-slate-800 border-slate-600 opacity-60 cursor-not-allowed grayscale' 
                                    : isPhys 
                                        ? 'bg-orange-900/40 border-orange-600 hover:bg-orange-800 active:border-b-0 active:translate-y-1' 
                                        : 'bg-cyan-900/40 border-cyan-600 hover:bg-cyan-800 active:border-b-0 active:translate-y-1'
                                }`}
                                title={!usable ? reason : skill.description}
                            >
                                {/* Contenu du bouton */}
                                <div className="flex justify-between items-start w-full">
                                    <span className={`text-[10px] md:text-xs font-black uppercase leading-tight text-left line-clamp-2 w-full ${isDisabled ? 'text-slate-400' : 'text-white'}`}>
                                        {skill.nom}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 w-full mt-1">
                                    <span className={`text-2xl ${isPhys ? 'text-orange-300' : 'text-cyan-300'} filter drop-shadow-md`}>
                                        {isPhys ? '⚔️' : '⚡'}
                                    </span>
                                    
                                    <div className="flex gap-2 text-[9px] font-mono text-white/80">
                                        <div className="flex flex-col leading-none">
                                            <span className="text-[7px] text-white/50 uppercase">Pui</span>
                                            <span className="font-bold text-yellow-300">{skill.puissance}</span>
                                        </div>
                                        <div className="flex flex-col leading-none">
                                            <span className="text-[7px] text-white/50 uppercase">Pré</span>
                                            <span className="font-bold text-green-300">{skill.precision}%</span>
                                        </div>
                                        {skill.cooldown > 0 && (
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[7px] text-white/50 uppercase">CD</span>
                                                <span className="font-bold text-blue-300">{skill.cooldown}t</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Overlay Cadenas */}
                                {!usable && (
                                    <div className="absolute top-2 right-2 bg-black/60 rounded-full w-6 h-6 flex items-center justify-center text-xs border border-white/20">
                                        🔒
                                    </div>
                                )}
                                {/* Overlay Chargement (Optionnel pour visuel) */}
                                {usable && isActionLoading && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <span className="animate-spin text-xl">⏳</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                    
                    <button 
                        onClick={() => setShowFleeModal(true)} 
                        className="h-20 bg-slate-800 hover:bg-red-900 border-b-4 border-slate-600 hover:border-red-600 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 active:border-b-0 active:translate-y-1 group"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">🏳️</span>
                        <span className="text-[9px] font-black uppercase mt-1">FUIR</span>
                    </button>
                </div>
            </div>
            
            <style jsx>{`
                .animate-slideInRight { animation: slideInRight 0.5s ease-out; }
                .animate-slideInLeft { animation: slideInLeft 0.5s ease-out; }
                @keyframes slideInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideInLeft { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default CombatTab;