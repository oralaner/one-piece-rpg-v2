import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const AdminTab = ({ theme }) => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [filter, setFilter] = useState("");

    const loadPlayers = async () => {
        setLoading(true);
        try {
            const data = await api.get('/game/admin/players');
            setPlayers(data || []);
        } catch (e) {
            alert("Accès refusé ou erreur serveur.");
        } finally { setLoading(false); }
    };

    useEffect(() => { loadPlayers(); }, []);

    const handleAction = async (targetId, action, amount = 0) => {
        if(!confirm(`Exécuter ${action} ?`)) return;
        try {
            await api.post('/game/admin/action', { targetId, action, amount });
            alert("Succès !");
            loadPlayers();
        } catch (e) { alert("Erreur action"); }
    };

    const handleBroadcast = async () => {
        if(!broadcastMsg) return;
        if(!confirm("Envoyer à TOUT le serveur ?")) return;
        try {
            await api.post('/game/admin/broadcast', { titre: "Gouvernement Mondial", message: broadcastMsg });
            setBroadcastMsg("");
            alert("Message envoyé.");
        } catch (e) { alert("Erreur envoi"); }
    };

    const filtered = players.filter(p => p.pseudo.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                <h2 className="text-xl font-black text-red-500 uppercase font-pirata mb-2">Zone Admin</h2>
                <div className="flex gap-2">
                    <input 
                        type="text" value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                        placeholder="Message serveur global..."
                        className="flex-1 bg-black/50 border border-red-900/50 rounded px-3 py-2 text-xs text-white"
                    />
                    <button onClick={handleBroadcast} className="bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2 rounded text-xs">BROADCAST</button>
                </div>
            </div>

            {/* Liste */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-slate-700 flex justify-between">
                    <h3 className="font-bold text-white text-sm">Joueurs ({filtered.length})</h3>
                    <input 
                        type="text" placeholder="Rechercher..." 
                        className="bg-black/50 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs text-slate-400">
                        <thead className="bg-black/40 text-slate-300 uppercase font-bold sticky top-0">
                            <tr>
                                <th className="p-3">Pseudo</th>
                                <th className="p-3">Niv</th>
                                <th className="p-3">Berrys</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filtered.map(p => (
                                <tr key={p.id} className="hover:bg-white/5">
                                    <td className="p-3 font-bold text-white flex items-center gap-2">
                                        {p.role === 'ADMIN' && '👑'} {p.pseudo}
                                        <span className="text-[9px] px-1 bg-slate-800 rounded text-slate-500">{p.faction}</span>
                                    </td>
                                    <td className="p-3">{p.niveau}</td>
                                    <td className="p-3 text-yellow-500">{p.berrys.toLocaleString()}</td>
                                    <td className="p-3 text-right flex justify-end gap-1">
                                    <button onClick={() => handleAction(p.id, 'GIVE_BERRYS', 100000)} className="bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-800 hover:bg-green-800" title="+100k Berrys">💰</button>
                                    <button onClick={() => handleAction(p.id, 'GIVE_XP', 5000)} className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-800 hover:bg-blue-800" title="+5k XP">⭐</button>
                                    <button onClick={() => handleAction(p.id, 'RESET_ENERGY')} className="bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded border border-yellow-800 hover:bg-yellow-800" title="Full Énergie">⚡</button>
                                    
                                    {/* 👇 NOUVEAU BOUTON RESET 👇 */}
                                    <button 
                                        onClick={() => {
                                            if(confirm("ATTENTION : Ceci va remettre le compte à ZERO (Niv 1, sans faction, sans inventaire). Continuer ?")) {
                                                handleAction(p.id, 'RESET_FULL');
                                            }
                                        }} 
                                        className="bg-orange-900/50 text-orange-300 px-2 py-1 rounded border border-orange-800 hover:bg-orange-800" 
                                        title="RESET TOTAL (Niv 1)"
                                    >
                                        ♻️
                                    </button>

                                    <button onClick={() => handleAction(p.id, 'BAN')} className="bg-red-900/50 text-red-300 px-2 py-1 rounded border border-red-800 hover:bg-red-800" title="Bannir">🚫</button>
                                </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminTab;