import React, { useState, useEffect } from 'react';

const CasinoTab = ({ theme, berrys, onPlay, cooldowns, casinoState }) => {
    const [selectedGame, setSelectedGame] = useState(null);
    const [mise, setMise] = useState(100);
    const [isAnimating, setIsAnimating] = useState(false);
    const [resultDisplay, setResultDisplay] = useState(null);
    const [botDiceValues, setBotDiceValues] = useState({ d1: 1, d2: 1 });

    // --- 🕒 HORLOGE TEMPS RÉEL (Pour les cooldowns) ---
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        // Ce timer force le rafraîchissement du composant chaque seconde
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // --- UTILITAIRES ---
    const formatTime = (ms) => {
        if (ms <= 0) return null;
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const getPFCIcon = (move) => {
        if (!move) return '❓';
        const m = move.toUpperCase();
        if (m.includes('PIERRE')) return '✊';
        if (m.includes('FEUILLE')) return '✋';
        if (m.includes('CISEAUX')) return '✌️';
        return '❓';
    };

    // --- LOGIQUE DE SECOURS ---
    const generateCoherentDice = (isWin) => {
        let b1, b2, p1, p2, sBot, sPlayer;
        let safe = 0;
        do {
            b1 = Math.floor(Math.random() * 6) + 1;
            b2 = Math.floor(Math.random() * 6) + 1;
            p1 = Math.floor(Math.random() * 6) + 1;
            p2 = Math.floor(Math.random() * 6) + 1;
            sBot = b1 + b2;
            sPlayer = p1 + p2;
            safe++;
        } while ((isWin ? sPlayer <= sBot : sPlayer > sBot) && safe < 50);
        return { botD1: b1, botD2: b2, playerD1: p1, playerD2: p2 };
    };

    const deduceCpuMove = (playerMove, isWin, isTie) => {
        if (isTie) return playerMove;
        if (playerMove === 'PIERRE') return isWin ? 'CISEAUX' : 'FEUILLE';
        if (playerMove === 'FEUILLE') return isWin ? 'PIERRE' : 'CISEAUX';
        if (playerMove === 'CISEAUX') return isWin ? 'FEUILLE' : 'PIERRE';
        return 'PIERRE';
    };

    // --- ACTION DE JEU ---
    const handlePlay = async (choix = null) => {
        // On vérifie le cooldown en temps réel avec 'now'
        const currentCooldown = (cooldowns[selectedGame] || 0) - now;
        
        if (berrys < mise && selectedGame !== 'QUITTE') return;
        if (currentCooldown > 0) return;

        setIsAnimating(true);
        setResultDisplay(null);

        // Animation Dés
        let animInterval;
        if (selectedGame === 'DES') {
            animInterval = setInterval(() => {
                setBotDiceValues({ 
                    d1: Math.floor(Math.random() * 6) + 1, 
                    d2: Math.floor(Math.random() * 6) + 1 
                });
            }, 80);
        }

        setTimeout(async () => {
            if (animInterval) clearInterval(animInterval);

            const res = await onPlay(selectedGame, mise, choix);
            
            setIsAnimating(false);

            if (res) {
                const finalRes = { ...res };

                // Simulation des données manquantes si besoin
                if (selectedGame === 'DES' && (!res.de1 || !res.bot_de1)) {
                    const fake = generateCoherentDice(res.success);
                    finalRes.de1 = fake.playerD1;
                    finalRes.de2 = fake.playerD2;
                    finalRes.bot_de1 = fake.botD1;
                    finalRes.bot_de2 = fake.botD2;
                    setBotDiceValues({ d1: fake.botD1, d2: fake.botD2 });
                }

                if (selectedGame === 'PFC') {
                    if (!res.choix_joueur) finalRes.choix_joueur = choix;
                    if (!res.choix_cpu) finalRes.choix_cpu = deduceCpuMove(choix, res.success, res.match_nul);
                }

                setResultDisplay(finalRes);
            }
        }, 1500);
    };

    // --- RENDER COMPOSANTS ---
    const Die = ({ value, color = "bg-white", dotColor = "bg-slate-900" }) => {
        const dotsMap = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
        const activeDots = dotsMap[value] || [];
        return (
            <div className={`w-12 h-12 md:w-16 md:h-16 ${color} rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.2)] border border-black/10 grid grid-cols-3 grid-rows-3 p-1.5 md:p-2`}>
                {[...Array(9)].map((_, i) => (
                    <div key={i} className={`flex items-center justify-center`}>
                        {activeDots.includes(i) && <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${dotColor}`}></div>}
                    </div>
                ))}
            </div>
        );
    };

    // --- RENDER 1 : DÉS ---
    const renderDes = () => {
        const botD1 = isAnimating ? Math.floor(Math.random() * 6) + 1 : (resultDisplay?.bot_de1 || botDiceValues.d1);
        const botD2 = isAnimating ? Math.floor(Math.random() * 6) + 1 : (resultDisplay?.bot_de2 || botDiceValues.d2);
        const playerD1 = isAnimating ? Math.floor(Math.random() * 6) + 1 : (resultDisplay?.de1 || 1);
        const playerD2 = isAnimating ? Math.floor(Math.random() * 6) + 1 : (resultDisplay?.de2 || 1);
        const scoreBot = botD1 + botD2;
        const scorePlayer = playerD1 + playerD2;
        const win = resultDisplay?.success;

        return (
            <div className="flex flex-col items-center gap-6 w-full animate-fadeIn">
                <div className="flex flex-col items-center opacity-80 scale-90">
                    <p className="text-[10px] uppercase font-bold text-red-400 mb-2 tracking-widest">Croupier</p>
                    <div className="flex gap-4 p-4 bg-red-950/30 rounded-2xl border border-red-900/50">
                        <Die value={botD1} color="bg-red-100" dotColor="bg-red-900" />
                        <Die value={botD2} color="bg-red-100" dotColor="bg-red-900" />
                    </div>
                    {!isAnimating && resultDisplay && <p className="text-xs font-bold text-red-400 mt-2">Total : {scoreBot}</p>}
                </div>
                <div className="font-black text-white text-2xl italic opacity-50">VS</div>
                <div className="flex flex-col items-center">
                    <p className="text-[10px] uppercase font-bold text-green-400 mb-2 tracking-widest">Vous</p>
                    <div className={`flex gap-4 p-4 bg-green-900/20 rounded-3xl border-2 border-green-500/30 shadow-lg ${win ? 'shadow-green-500/20' : ''}`}>
                        <Die value={playerD1} />
                        <Die value={playerD2} />
                    </div>
                    {!isAnimating && resultDisplay && (
                        <div className="text-center mt-2 animate-popIn">
                            <p className={`text-xl font-black ${win ? 'text-green-400' : 'text-red-400'}`}>{scorePlayer}</p>
                            {win && playerD1 === playerD2 && <span className="text-[9px] bg-yellow-500 text-black font-black px-2 py-0.5 rounded-full animate-pulse shadow-glow">DOUBLE ! (x4)</span>}
                        </div>
                    )}
                </div>
                {resultDisplay && !isAnimating && (
                    <div className={`mt-2 px-8 py-3 rounded-xl border-2 font-black uppercase tracking-[0.2em] text-xl shadow-2xl transform scale-110 
                        ${win ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                        {win ? 'VICTOIRE !' : 'DÉFAITE'}
                    </div>
                )}
            </div>
        );
    };

    // --- RENDER 2 : PFC ---
    const renderPFC = () => {
        const cpuChoice = isAnimating ? '✊' : getPFCIcon(resultDisplay?.choix_cpu);
        const playerChoice = isAnimating ? '✊' : getPFCIcon(resultDisplay?.choix_joueur);

        return (
            <div className="flex flex-col items-center gap-8 w-full animate-fadeIn">
                <div className="flex items-center justify-between w-full max-w-md px-4 py-8 bg-slate-900/50 rounded-3xl border border-slate-700 relative overflow-hidden">
                    <div className="text-center relative z-10">
                        <p className="text-[10px] uppercase font-bold text-blue-400 mb-4">Vous</p>
                        <div className={`text-6xl md:text-7xl transition-transform duration-300 ${isAnimating ? 'animate-bounce' : ''}`}>{playerChoice}</div>
                    </div>
                    <div className="text-3xl font-black text-slate-700 italic">VS</div>
                    <div className="text-center relative z-10">
                        <p className="text-[10px] uppercase font-bold text-red-400 mb-4">Adversaire</p>
                        <div className={`text-6xl md:text-7xl transition-transform duration-300 ${isAnimating ? 'animate-bounce' : ''}`}>{cpuChoice}</div>
                    </div>
                </div>
                {!isAnimating && !resultDisplay && (
                    <div className="flex gap-4 w-full max-w-sm">
                        {['PIERRE', 'FEUILLE', 'CISEAUX'].map(c => (
                            <button key={c} onClick={() => handlePlay(c)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 hover:-translate-y-1 rounded-2xl text-3xl border-b-4 border-slate-950 hover:border-slate-600 shadow-xl transition active:scale-95 active:border-b-0 active:translate-y-1">
                                {getPFCIcon(c)}
                            </button>
                        ))}
                    </div>
                )}
                {resultDisplay && !isAnimating && (
                    <div className="text-center animate-popIn">
                        <p className={`text-3xl font-black uppercase tracking-widest drop-shadow-lg 
                            ${resultDisplay.success ? 'text-green-400' : resultDisplay.match_nul ? 'text-yellow-400' : 'text-red-500'}`}>
                            {resultDisplay.success ? 'GAGNÉ !' : resultDisplay.match_nul ? 'ÉGALITÉ' : 'PERDU...'}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // --- RENDER 3 : QUITTE OU DOUBLE ---
    const renderQuitte = () => {
        const enCours = casinoState?.enCours || false;
        const gain = casinoState?.gainActuel || 0;
        
        return (
            <div className="flex flex-col items-center gap-8 w-full animate-fadeIn">
                <div className="relative w-40 h-40">
                    <div className={`absolute inset-0 rounded-full border-4 border-yellow-500 bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_50px_rgba(234,179,8,0.5)] flex items-center justify-center text-6xl transition-all duration-700 ${isAnimating ? 'animate-spin' : ''}`}>
                        {enCours ? '🤑' : '🪙'}
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Gain Potentiel</p>
                    <p className="text-5xl font-black text-yellow-400 font-pirata drop-shadow-lg">
                        {enCours ? gain.toLocaleString() : (mise * 2).toLocaleString()} ฿
                    </p>
                    {enCours && <p className="text-xs text-green-400 font-bold bg-green-900/30 px-3 py-1 rounded-full inline-block border border-green-500/30">Série : {casinoState.streak} victoires</p>}
                </div>
                {!isAnimating && (
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        {enCours ? (
                            <>
                                <button onClick={() => handlePlay('CONTINUER')} className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-slate-900 rounded-xl font-black uppercase shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 border-b-4 border-yellow-800">
                                    <span>🎲</span> Tenter le Double ({(gain * 2).toLocaleString()} ฿)
                                </button>
                                <button onClick={() => handlePlay('STOP')} className="w-full py-3 bg-slate-800 border border-green-500/50 text-green-400 rounded-xl font-bold uppercase hover:bg-green-900/20 transition active:scale-95">
                                    <span>💰</span> Encaisser ({gain.toLocaleString()} ฿)
                                </button>
                            </>
                        ) : (
                            <button onClick={() => handlePlay('LANCER')} disabled={(cooldowns['QUITTE'] || 0) > now} className={`w-full py-4 rounded-xl font-black uppercase shadow-lg transition flex items-center justify-center gap-2 ${(cooldowns['QUITTE'] || 0) > now ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-yellow-600 text-slate-900 hover:bg-yellow-500 border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1'}`}>
                                {(cooldowns['QUITTE'] || 0) > now ? `Recharge (${formatTime(cooldowns['QUITTE'] - now)})` : "Lancer la pièce"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10 pt-2">
            {/* HEADER */}
            <div className={`p-5 rounded-2xl border-b-4 shadow-xl relative overflow-hidden ${theme.btnPrimary}`}>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest text-white font-pirata drop-shadow-md">Le Tripot</h2>
                        <p className="text-xs opacity-90 font-bold uppercase tracking-wide">Faites vos jeux</p>
                    </div>
                    <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/10 text-right backdrop-blur-sm">
                        <p className="text-[10px] text-yellow-500 uppercase font-bold">Solde</p>
                        <p className="text-xl font-black text-white">{berrys.toLocaleString()} ฿</p>
                    </div>
                </div>
            </div>

            {!selectedGame ? (
                // MENU DES JEUX (AVEC COOLDOWNS EN TEMPS RÉEL)
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { id: 'DES', label: 'Duel de Dés', icon: '🎲', color: 'text-green-400', desc: 'Score le plus haut gagne (x2). Double = x4 !' },
                        { id: 'PFC', label: 'Chifoumi', icon: '✂️', color: 'text-blue-400', desc: 'Pierre, Feuille, Ciseaux classique.' },
                        { id: 'QUITTE', label: 'Quitte ou Double', icon: '🪙', color: 'text-yellow-400', desc: 'Enchaînez les piles ou faces pour multiplier.' }
                    ].map(g => {
                        const remaining = (cooldowns[g.id] || 0) - now;
                        return (
                            <button 
                                key={g.id} 
                                onClick={() => setSelectedGame(g.id)}
                                className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl flex flex-col items-center gap-3 hover:border-white/30 hover:bg-slate-800 hover:-translate-y-1 transition-all group shadow-lg"
                            >
                                <div className="text-5xl group-hover:scale-110 transition-transform mb-2">{g.icon}</div>
                                <h3 className={`font-black uppercase font-pirata text-xl ${g.color}`}>{g.label}</h3>
                                <p className="text-xs text-slate-400 text-center leading-relaxed">{g.desc}</p>
                                
                                {/* 🔥 TIMER EN TEMPS RÉEL */}
                                {remaining > 0 && (
                                    <span className="mt-3 text-[10px] font-bold bg-red-900/50 text-red-400 px-3 py-1 rounded-full border border-red-500/20 animate-pulse">
                                        ⏳ {formatTime(remaining)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                // JEU SÉLECTIONNÉ
                <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
                    <button onClick={() => { setSelectedGame(null); setResultDisplay(null); }} className="absolute top-4 left-4 text-slate-500 hover:text-white transition font-bold text-xs uppercase flex items-center gap-1 z-20">
                        ⬅ Retour
                    </button>

                    <div className="text-center mb-6 relative z-10">
                        <h3 className="text-2xl font-black uppercase font-pirata text-white tracking-widest">
                            {selectedGame === 'DES' ? 'Duel de Dés' : selectedGame === 'PFC' ? 'Chifoumi' : 'Quitte ou Double'}
                        </h3>
                    </div>

                    {!(selectedGame === 'QUITTE' && casinoState?.enCours) && (
                        <div className="mb-8 flex flex-col items-center animate-fadeIn">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Votre Mise</label>
                            <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-slate-700">
                                <button onClick={() => setMise(Math.max(100, mise - 100))} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition">-</button>
                                <span className="text-xl font-black text-yellow-400 min-w-[80px] text-center font-mono">{mise}</span>
                                <button onClick={() => setMise(Math.min(berrys, mise + 100))} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition">+</button>
                            </div>
                            <div className="flex gap-2 mt-2">
                                {[100, 500, 1000, 5000].map(m => (
                                    <button key={m} onClick={() => setMise(m)} disabled={berrys < m} className={`text-[9px] font-bold px-2 py-1 rounded transition ${berrys < m ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-800 text-slate-400 hover:bg-white hover:text-black'}`}>{m}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex items-center justify-center relative z-10 py-4">
                        {selectedGame === 'DES' && renderDes()}
                        {selectedGame === 'PFC' && renderPFC()}
                        {selectedGame === 'QUITTE' && renderQuitte()}
                    </div>

                    {!isAnimating && !resultDisplay && selectedGame === 'DES' && (
                        <div className="mt-4 flex justify-center animate-fadeIn">
                            {/* 🔥 BOUTON AVEC TIMER TEMPS RÉEL */}
                            <button 
                                onClick={() => handlePlay()} 
                                disabled={(cooldowns[selectedGame] || 0) > now || berrys < mise} 
                                className={`w-full max-w-sm py-4 rounded-xl font-black uppercase shadow-lg transition flex items-center justify-center gap-2 
                                ${(cooldowns[selectedGame] || 0) > now || berrys < mise ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : `${theme.btnPrimary} hover:brightness-110 active:scale-95 border-b-4 border-black/20 active:border-b-0 active:translate-y-1`}`}
                            >
                                {(cooldowns[selectedGame] || 0) > now 
                                    ? <span>⏳ Recharge ({formatTime((cooldowns[selectedGame] || 0) - now)})</span> 
                                    : berrys < mise ? <span>💸 Fonds Insuffisants</span> : <span>JOUER ({mise} ฿)</span>}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CasinoTab;