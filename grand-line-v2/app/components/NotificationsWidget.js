import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const NotificationWidget = () => {
    const [notifs, setNotifs] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifs.filter(n => !n.lu).length;

    const fetchNotifs = async () => {
        try {
            const data = await api.get('/game/notifications');
            setNotifs(data || []);
        } catch (e) { console.error(e); }
    };

    // Polling toutes les 30 secondes
    useEffect(() => {
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.post(`/game/notifications/${id}/read`);
            setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
        } catch (e) {}
    };

    return (
        <div className="relative z-50">
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 hover:bg-white/10 rounded-full transition">
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto">
                    <div className="p-3 bg-black/40 border-b border-white/5 font-bold text-xs text-slate-300">
                        NOTIFICATIONS
                    </div>
                    {notifs.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">Rien à signaler, capitaine.</div>
                    ) : (
                        notifs.map(n => (
                            <div 
                                key={n.id} 
                                onClick={() => !n.lu && markAsRead(n.id)}
                                className={`p-3 border-b border-white/5 text-xs cursor-pointer hover:bg-white/5 transition ${!n.lu ? 'bg-blue-900/20 border-l-2 border-l-blue-500' : 'opacity-60'}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className={`font-bold ${!n.lu ? 'text-white' : 'text-slate-400'}`}>{n.titre}</span>
                                    <span className="text-[10px] text-slate-600">{new Date(n.created_at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-300 leading-snug">{n.message}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationWidget;