import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // 👈 Import crucial pour sortir du conteneur
import { api } from '../utils/api';

const NotificationWidget = () => {
    const [notifs, setNotifs] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    
    // Pour calculer la position
    const buttonRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    const unreadCount = notifs.filter(n => !n.lu).length;

    useEffect(() => {
        setMounted(true);
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fermer si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target) && isOpen) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const fetchNotifs = async () => {
        try {
            const data = await api.get('/game/notifications');
            setNotifs(data || []);
        } catch (e) { console.error(e); }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/game/notifications/${id}/read`);
            setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
        } catch (e) {}
    };

    const toggleOpen = () => {
        if (!isOpen && buttonRef.current) {
            // Calculer la position exacte du bouton pour placer la liste juste en dessous
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 10, // 10px en dessous du bouton
                left: rect.left // Aligné à gauche du bouton
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* BOUTON CLOCHE (Reste à sa place dans le profil) */}
            <button 
                ref={buttonRef}
                onClick={toggleOpen} 
                className={`relative p-2 rounded-xl border transition-all duration-300 group
                ${isOpen ? 'bg-slate-800 border-white/30' : 'bg-black/20 border-transparent hover:bg-white/5'}`}
            >
                <span className="text-xl group-hover:scale-110 block transition-transform">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce shadow-sm border border-black/50">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* LISTE DES NOTIFICATIONS (Téléportée sur le Body pour ne pas être coupée) */}
            {mounted && isOpen && createPortal(
                <div 
                    className="fixed z-[9999] w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-fadeIn"
                    style={{ 
                        top: coords.top, 
                        left: coords.left,
                        maxHeight: '400px' // Hauteur max avant scroll
                    }}
                >
                    {/* Header */}
                    <div className="p-3 bg-black/60 border-b border-white/5 flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-300 uppercase tracking-widest font-pirata">Journal de bord</span>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition">✕</button>
                    </div>

                    {/* Liste scrollable */}
                    <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '350px' }}>
                        {notifs.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-500 italic">
                                Aucune nouvelle, bonne nouvelle !
                            </div>
                        ) : (
                            notifs.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => !n.lu && markAsRead(n.id)}
                                    className={`p-3 border-b border-white/5 text-xs cursor-pointer transition-colors relative group
                                    ${!n.lu ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}
                                >
                                    {!n.lu && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                                    
                                    <div className="flex justify-between mb-1 pl-2">
                                        <span className={`font-bold ${!n.lu ? 'text-blue-200' : 'text-slate-400'}`}>{n.titre}</span>
                                        <span className="text-[9px] text-slate-600 font-mono">
                                            {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 leading-snug pl-2 group-hover:text-white transition-colors">{n.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>,
                document.body // 👈 C'est ici que la magie opère (rendu hors de la sidebar)
            )}
        </>
    );
};

export default NotificationWidget;