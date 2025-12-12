import React, { useState } from 'react';

const TeamTab = ({ 

    
    myTeam,         // L'objet alliance actuel (monEquipage)
    members,        // Liste des membres (membresEquipage)
    allTeams,       // Liste des alliances à rejoindre (listeEquipages)
    logs,           // Logs de banque (banqueLogs)
    candidatures,   // Demandes d'adhésion
    currentUser,    // Moi
    onAction,       // L'objet crewAction du hook
    theme, 
}) => {

    console.log("TeamTab Render:", {
        id: myTeam?.id,
        etat: myTeam?.expedition_etat, // Est-ce bien 'PREPARATION' ?
        participants: myTeam?.expedition_participants,
        moi: currentUser?.id
    });
    const [subTab, setSubTab] = useState('QG'); // QG, MEMBRES, TRESORERIE, ADMIN
    const [createName, setCreateName] = useState("");
    const [donation, setDonation] = useState(1000);
    const [activeJoinTab, setActiveJoinTab] = useState('LISTE'); // LISTE ou CREER
    const [bankAmount, setBankAmount] = useState("");
    const [editName, setEditName] = useState(myTeam ? myTeam.nom : "");
    const [editDesc, setEditDesc] = useState(myTeam ? myTeam.description : "");
    // Petit composant utilitaire pour le compte à rebours
    // Composant Timer Amélioré
        const RaidTimer = ({ targetDate, onFinish, label = "⏱️" }) => {
            const [timeLeft, setTimeLeft] = React.useState("");

            React.useEffect(() => {
                const calculateTime = () => {
                    const now = new Date().getTime();
                    const distance = new Date(targetDate).getTime() - now;

                    if (distance < 0) {
                        setTimeLeft("TERMINE");
                        if (onFinish) onFinish(); // Déclenche l'action quand c'est fini
                        return false; // Stop
                    } else {
                        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                        
                        // Formatage propre (01h 05m 30s)
                        const hDisplay = hours > 0 ? `${hours}h ` : "";
                        const mDisplay = minutes > 0 ? `${minutes}m ` : "";
                        const sDisplay = `${seconds}s`;
                        
                        setTimeLeft(`${hDisplay}${mDisplay}${sDisplay}`);
                        return true; // Continue
                    }
                };

                // Calcul immédiat
                if(calculateTime()) {
                    const interval = setInterval(() => {
                        if (!calculateTime()) clearInterval(interval);
                    }, 1000);
                    return () => clearInterval(interval);
                }
            }, [targetDate]);

            return <span>{label} {timeLeft}</span>;
        };
    // Est-ce que je suis le chef ?
    const isLeader = myTeam && myTeam.chef_id === currentUser.id;
        React.useEffect(() => {
            if (myTeam) {
                setEditName(myTeam.nom);
                setEditDesc(myTeam.description || "");
            }
        }, [myTeam]);
    // --- VUE 1 : PAS D'ALLIANCE ---
    if (!myTeam) {
        return (
            <div className="space-y-6 animate-fadeIn pb-10 pt-2">
                
                {/* Header Bienvenue */}
                <div className={`p-6 rounded-2xl border-b-4 shadow-xl relative overflow-hidden bg-indigo-900 border-indigo-500`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-white font-pirata drop-shadow-md">Alliances</h2>
                        <p className="text-xs opacity-90 font-bold uppercase tracking-wide text-indigo-200">L'union fait la force sur Grand Line</p>
                    </div>
                </div>

                {/* Switch Créer / Rejoindre */}
                <div className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-700">
                    <button onClick={() => setActiveJoinTab('LISTE')} className={`flex-1 py-3 rounded-lg font-black uppercase text-xs tracking-wider transition-all ${activeJoinTab === 'LISTE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                        Rejoindre
                    </button>
                    <button onClick={() => setActiveJoinTab('CREER')} className={`flex-1 py-3 rounded-lg font-black uppercase text-xs tracking-wider transition-all ${activeJoinTab === 'CREER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                        Fonder une Alliance
                    </button>
                </div>

                {/* Contenu */}
                {activeJoinTab === 'LISTE' ? (
                    <div className="grid grid-cols-1 gap-3">
                        {allTeams.length === 0 ? (
                            <p className="text-center text-slate-500 italic py-10">Aucune alliance ne recrute pour le moment...</p>
                        ) : (
                            allTeams.map(team => (
                                <div key={team.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-indigo-500/50 transition-colors">
                                    <div>
                                        <h3 className="font-black text-indigo-400 uppercase text-lg">{team.nom}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                                            Niv {team.niveau} • {team.membres_count || '?'} Membres
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => onAction.rejoindre(team.id)}
                                        className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg border border-slate-600 hover:border-indigo-400 transition"
                                    >
                                        Postuler
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="bg-slate-900/90 border border-slate-700 p-6 rounded-xl text-center space-y-4">
                        <div className="text-4xl">🤝</div>
                        <h3 className="text-white font-black uppercase">Fondez votre Empire</h3>
                        <p className="text-xs text-slate-400">Créer une alliance coûte <span className="text-yellow-400 font-bold">100,000 ฿</span>.</p>
                        
                        <input 
                            type="text" 
                            placeholder="Nom de l'Alliance" 
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            maxLength={20}
                            className="w-full bg-black/40 border border-slate-600 rounded-lg px-4 py-3 text-white text-center font-bold focus:border-indigo-500 outline-none"
                        />
                        
                        <button 
                            onClick={() => onAction.creer(createName)}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase rounded-lg shadow-lg transition active:scale-95"
                        >
                            Créer et Payer
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // --- VUE 2 : DANS UNE ALLIANCE ---
    return (
        <div className="space-y-6 animate-fadeIn pb-10 pt-2">
            
            {/* --- HEADER ALLIANCE --- */}
            <div className="bg-slate-900 border-b-4 border-indigo-600 rounded-2xl shadow-2xl relative overflow-hidden">
                {/* Background Banner */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-slate-900/90 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 z-0"></div>
                
                <div className="relative z-10 p-6 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-slate-950 border-4 border-indigo-500 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(99,102,241,0.5)] mb-3">
                        🏰
                    </div>
                    <h2 className="text-3xl font-black uppercase text-white font-pirata tracking-widest drop-shadow-lg">{myTeam.nom}</h2>
                    <div className="flex gap-3 mt-2">
                        <span className="bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Niveau {myTeam.niveau}</span>
                        <span className="bg-yellow-600/20 border border-yellow-500/50 text-yellow-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{members.length} Membres</span>
                    </div>
                </div>

                {/* Barre Navigation Interne */}
                <div className="flex bg-black/40 backdrop-blur-sm p-1">
                    {['QG', 'MEMBRES', 'TRESORERIE', ...(isLeader ? ['ADMIN'] : [])].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setSubTab(tab)}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors relative
                            ${subTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                            {subTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div>}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- CONTENU DES ONGLETS --- */}
            
            {/* 1. QG (Infos Générales) */}
            {/* DANS TeamTab.js */}

{/* 1. QG (Infos Générales) */}
{subTab === 'QG' && (
    <div className="space-y-4">
        
        {/* --- INFOS DE L'ALLIANCE (Description, Argent...) --- */}
        <div className="bg-slate-900/80 border border-slate-700 p-5 rounded-xl text-center">
            <p className="text-sm text-slate-300 italic">" {myTeam.description || "Aucune description."} "</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex flex-col items-center">
                <span className="text-3xl mb-2">💰</span>
                <p className="text-[10px] uppercase font-bold text-slate-500">Fonds</p>
                <p className="text-xl font-black text-yellow-400">{parseInt(myTeam.berrys_banque || 0).toLocaleString()} ฿</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex flex-col items-center">
                <span className="text-3xl mb-2">🏆</span>
                <p className="text-[10px] uppercase font-bold text-slate-500">Niveau</p>
                <p className="text-xl font-black text-white">{myTeam.niveau}</p>
                {/* Barre XP */}
                <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-700 relative overflow-hidden mt-1">
                    <div 
                        className="h-full bg-indigo-500"
                        style={{ width: `${Math.min(100, (parseInt(myTeam.xp || 0) / ((myTeam.niveau || 1) * 1000)) * 100)}%` }}
                    ></div>
                </div>
            </div>
        </div>

        {/* 👇👇 LE BLOC RAID DOIT ÊTRE ICI (VISIBLE PAR TOUS) 👇👇 */}
        {/* IL NE DOIT PAS ÊTRE DANS UNE ACCOLADE {isLeader && ...} */}
        
        <div className="mb-6 mt-4 border-t border-white/10 pt-4">
            
            {/* CAS 1 : AUCUN RAID (Seul le chef voit le bouton) */}
            {myTeam.expedition_etat === 'AUCUNE' && isLeader && (
                <button 
                    onClick={onAction.raid?.ouvrir}
                    className="w-full py-4 bg-gradient-to-r from-red-900 to-red-700 border border-red-500 text-white font-black uppercase rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
                    <span className="text-2xl animate-pulse">⚔️</span>
                    <span>Planifier une Opération</span>
                </button>
            )}

            {/* ÉTAT 2 : PRÉPARATION */}
            {myTeam.expedition_etat === 'PREPARATION' && (
                <div className="bg-yellow-900/30 border border-yellow-600/50 p-4 rounded-xl text-center animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-500/5"></div>
                    
                    <h4 className="text-yellow-400 font-black uppercase tracking-widest mb-2 text-lg relative z-10">⚠️ Appel aux Armes ! ⚠️</h4>
                    <p className="text-sm text-slate-200 mb-2 relative z-10">Rassemblement avant le départ !</p>
                    
                    {/* --- LE CHRONO PRÉPARATION --- */}
                    {/* Quand il arrive à 0, il appelle check() pour passer automatiquement en EN_COURS */}
                    <div className="text-2xl font-mono font-bold text-white mb-4 relative z-10 bg-black/40 inline-block px-4 py-1 rounded">
                        <RaidTimer 
                            targetDate={myTeam.expedition_fin} 
                            label="Départ dans :"
                            onFinish={() => onAction.raid?.check(myTeam.id)} 
                        />
                    </div>

                    <div className="flex flex-col gap-2 relative z-10">
                        {!(myTeam.expedition_participants || []).includes(currentUser.id) ? (
                            <button 
                                onClick={onAction.raid?.rejoindre}
                                className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-black uppercase rounded shadow-lg"
                            >
                                REJOINDRE ({ (myTeam.expedition_participants || []).length } inscrits)
                            </button>
                        ) : (
                            <div className="bg-green-900/50 border border-green-500/50 p-2 rounded text-green-400 font-bold text-sm">
                                ✅ Prêt au combat ({ (myTeam.expedition_participants || []).length } inscrits)
                            </div>
                        )}

                        {isLeader && (
                            <button 
                                onClick={onAction.raid?.forcerDepart}
                                className="w-full px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold uppercase rounded text-xs border border-red-400 mt-2"
                            >
                                FORCER LE DÉPART MAINTENANT ⚔️
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ÉTAT 3 : EN COURS */}
            {myTeam.expedition_etat === 'EN_COURS' && (
                <div className="bg-blue-900/30 border border-blue-600/50 p-4 rounded-xl text-center relative">
                    <h4 className="text-blue-400 font-black uppercase tracking-widest mb-1">🌊 En Mission 🌊</h4>
                    <p className="text-xs text-slate-300 mb-4">Vos nakamas se battent en ce moment même.</p>
                    
                    {/* --- LE CHRONO MISSION --- */}
                    {/* Quand il arrive à 0, il appelle check() pour calculer la victoire/défaite */}
                    <div className="text-3xl font-mono font-black text-blue-200 mb-4 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                        <RaidTimer 
                            targetDate={myTeam.expedition_fin} 
                            label="Retour :"
                            onFinish={() => onAction.raid?.check(myTeam.id)}
                        />
                    </div>

                    <div className="flex justify-center gap-4 text-[10px] text-slate-400 font-mono bg-black/30 p-2 rounded inline-block">
                        <span>Soldats : {(myTeam.expedition_participants || []).length}</span>
                    </div>
                </div>
            )}
        </div>
        {/* 👆👆 FIN DU BLOC RAID 👆👆 */}

            {/* ÉTAT 4 : EN RÉPARATION (PUNITIF) */}
            {myTeam.expedition_etat === 'EN_REPARATION' && (
                <div className="bg-red-950/40 border border-red-600/50 p-6 rounded-xl text-center relative overflow-hidden group">
                    {/* Fond animé fumée/feu */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>
                    <div className="absolute inset-0 bg-red-900/10 animate-pulse"></div>

                    <h4 className="text-red-500 font-black uppercase tracking-widest mb-2 text-2xl relative z-10 drop-shadow-md">🔥 Navire Détruit 🔥</h4>
                    
                    <p className="text-sm text-red-200 mb-6 relative z-10">
                        Votre dernière expédition a été un fiasco. Le navire doit être réparé et l'équipage doit panser ses plaies (-50 PV).
                    </p>
                    
                    <div className="inline-block bg-black/60 border border-red-900/50 p-4 rounded-lg relative z-10">
                        <p className="text-[10px] text-red-400 uppercase font-bold mb-1">Fin des réparations</p>
                        <div className="text-3xl font-mono font-bold text-white">
                            {/* On réutilise le Timer mais sans action de fin, juste attendre */}
                            <RaidTimer targetDate={myTeam.expedition_fin} label="" />
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-red-400/60 italic relative z-10">
                        Impossible de lancer une mission pour le moment.
                    </div>
                    
                    {/* Petit bouton pour débloquer si le temps est fini (au cas où le serveur n'a pas auto-reset) */}
                    {new Date() > new Date(myTeam.expedition_fin) && (
                         <button 
                            onClick={() => onAction.raid?.check(myTeam.id)}
                            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded relative z-10"
                        >
                            Vérifier les réparations
                        </button>
                    )}
                </div>
            )}
        {/* --- BOUTON QUITTER --- */}
        <button 
            onClick={() => { if(window.confirm("Quitter l'alliance ?")) onAction.quitter(); }}
            className="w-full py-3 border border-red-900/50 text-red-500 text-[10px] font-bold uppercase rounded-xl hover:bg-red-900/20 transition"
        >
            Quitter l'Alliance
        </button>
    </div>
)}

            {/* 2. MEMBRES */}
            {subTab === 'MEMBRES' && (
                <div className="grid grid-cols-1 gap-3">
                    {members.map(membre => (
                        <div key={membre.id} className="relative flex items-center gap-4 bg-slate-900/80 border border-slate-700 p-3 rounded-xl hover:border-indigo-500/30 transition-colors group">
                            {/* Conteneur parent relatif pour gérer la superposition */}
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-slate-950 border border-white/10 overflow-hidden relative z-10">
                                        {membre.avatar_url ? <img src={membre.avatar_url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full">👤</div>}
                                    </div>
                                    
                                    {/* Badge positionné en absolu PAR DESSUS l'avatar (z-20) */}
                                    {membre.id === myTeam.chef_id && (
                                        <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-[8px] px-1.5 py-0.5 rounded-full text-black font-black border border-white shadow-sm z-20">
                                            CHEF
                                        </div>
                                    )}
                                </div>
                            
                            <div className="flex-1">
                                <h4 className="font-black text-white text-sm">{membre.pseudo}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Niveau {membre.niveau} • {membre.id === myTeam.chef_id ? 'Fondateur' : 'Membre'}</p>
                            </div>

                            {/* Actions Chef (Kick) */}
                            {isLeader && membre.id !== currentUser.id && (
                                <button 
                                    onClick={() => onAction.kick(membre.id, membre.pseudo)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-red-900/50 text-red-400 text-[9px] font-bold uppercase rounded border border-red-900 hover:bg-red-900 hover:text-white"
                                >
                                    Exclure
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 3. TRÉSORERIE */}
            {subTab === 'TRESORERIE' && (
                <div className="space-y-6">
                    {/* Zone de Don */}
                    <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-xl text-center">
                        <h3 className="font-black text-white uppercase mb-4">Contribuer à l'effort de guerre</h3>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <button onClick={() => setDonation(Math.max(100, donation - 100))} className="w-8 h-8 rounded bg-slate-800 text-white font-bold">-</button>
                            <input 
                                type="number" 
                                value={donation}
                                onChange={(e) => setDonation(parseInt(e.target.value) || 0)}
                                className="w-32 bg-slate-900 border border-slate-600 rounded p-2 text-center text-yellow-400 font-black"
                            />
                            <button onClick={() => setDonation(donation + 100)} className="w-8 h-8 rounded bg-slate-800 text-white font-bold">+</button>
                        </div>
                        <button 
                            onClick={() => onAction.banque('DEPOSER', donation)}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase rounded-lg shadow-lg transition"
                        >
                            Faire un Don ({donation} ฿)
                        </button>
                    </div>

                    {/* Logs */}
                    <div>
                        <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Journal des Transactions</h4>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                            {logs && logs.length > 0 ? logs.map((log, i) => (
                                <div key={i} className="flex justify-between items-center p-3 border-b border-white/5 text-xs last:border-0">
                                    <span className="text-slate-300 font-bold">{log.pseudo_joueur}</span>
                                    <span className={log.type_action === 'DEPOT' ? 'text-green-400 font-mono' : 'text-red-400 font-mono'}>
                                        {log.type_action === 'DEPOT' ? '+' : '-'}{log.montant.toLocaleString()} ฿
                                    </span>
                                </div>
                            )) : (
                                <p className="text-center py-4 text-slate-600 italic text-xs">Aucune transaction récente.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* 4. ADMIN (Chef seulement) */}
            {subTab === 'ADMIN' && isLeader && (
                <div className="space-y-4">
                    <h3 className="font-black text-white uppercase text-sm border-b border-white/10 pb-2">Candidatures en attente</h3>
                    
                    {candidatures && candidatures.length > 0 ? (
                        candidatures.map(cand => (
                            <div key={cand.id} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center justify-between">
                                <span className="text-white font-bold text-sm">{cand.pseudo_joueur}</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onAction.recruter(cand.id, true)}
                                        className="w-8 h-8 bg-green-600 hover:bg-green-500 text-white rounded flex items-center justify-center shadow"
                                    >
                                        ✓
                                    </button>
                                    <button 
                                        onClick={() => onAction.recruter(cand.id, false)}
                                        className="w-8 h-8 bg-red-900 hover:bg-red-800 text-white rounded flex items-center justify-center shadow"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 italic text-xs">Aucune demande en attente.</p>
                    )}

                    <div className="pt-4 border-t border-white/10 mt-4">
                         <h3 className="font-black text-white uppercase text-sm pb-2">Paramètres de l'Alliance</h3>
                         
                         <div className="space-y-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                             {/* Input NOM */}
                             <div>
                                 <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Nom de l'Alliance</label>
                                 <input 
                                     type="text" 
                                     value={editName}
                                     onChange={(e) => setEditName(e.target.value)}
                                     maxLength={20}
                                     className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none font-bold"
                                 />
                             </div>

                             {/* Textarea DESCRIPTION */}
                             <div>
                                 <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Description / Devise</label>
                                 <textarea 
                                     value={editDesc}
                                     onChange={(e) => setEditDesc(e.target.value)}
                                     maxLength={100}
                                     rows={3}
                                     className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none resize-none"
                                     placeholder="Écrivez votre légende..."
                                 />
                             </div>

                             {/* Bouton Sauvegarder */}
                             <button 
                                 onClick={() => onAction.settings(editName, editDesc)}
                                 className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase rounded text-xs shadow-lg transition"
                             >
                                 Enregistrer les modifications
                             </button>
                         </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TeamTab;