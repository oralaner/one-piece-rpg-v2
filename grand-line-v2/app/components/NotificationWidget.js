import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../utils/api';

const NotificationWidget = () => {
    const [notifs, setNotifs] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    
    // Références
    const buttonRef = useRef(null); // Le bouton cloche
    const listRef = useRef(null);   // 👇 La liste déroulante (Nouveau)

    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    const unreadCount = notifs.filter(n => !n.lu).length;

    useEffect(() => {
        setMounted(true);
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    // --- GESTION DU CLIC EXTÉRIEUR (CORRIGÉE) ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Si le menu n'est pas ouvert, on s'en fiche
            if (!isOpen) return;

            // Si on clique sur le bouton, on laisse le toggle faire son travail
            if (buttonRef.current && buttonRef.current.contains(event.target)) return;

            // 👇 ICI LA CORRECTION : Si on clique DANS la liste, on ne ferme pas !
            if (listRef.current && listRef.current.contains(event.target)) return;

            // Sinon (clic ailleurs dans le vide), on ferme
            setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]); // On dépend de isOpen pour activer/désactiver le listener logiquement

    const fetchNotifs = async () => {
        try {
            const data = await api.get('/game/notifications');
            setNotifs(data || []);
        } catch (e) { console.error(e); }
    };

    const markAsRead = async (id, e) => {
        // Empêche le clic de remonter (sécurité supplémentaire)
        if (e) e.stopPropagation();

        try {
            // Mise à jour visuelle optimiste (immédiate)
            setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
            
            // Appel serveur
            await api.post(`/game/notifications/${id}/read`);
        } catch (err) {
            console.error("Erreur lecture notif", err);
        }
    };

    const toggleOpen = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 10,
                left: rect.left
            });
            // On rafraîchit la liste à l'ouverture pour être sûr d'être à jour
            fetchNotifs();
        }
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* BOUTON CLOCHE */}
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

            {/* LISTE DES NOTIFICATIONS (Portal) */}
            {mounted && isOpen && createPortal(
                <div 
                    ref={listRef} // 👈 On attache la référence ici
                    className="fixed z-[9999] w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-fadeIn"
                    style={{ 
                        top: coords.top, 
                        left: coords.left,
                        maxHeight: '400px'
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
                                    // On passe l'événement 'e' pour le stopPropagation
                                    onClick={(e) => !n.lu && markAsRead(n.id, e)}
                                    className={`p-3 border-b border-white/5 text-xs cursor-pointer transition-colors relative group
                                    ${!n.lu ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'hover:bg-white/5 opacity-60 grayscale'}`}
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
                document.body
            )}
        </>
    );
};

export default NotificationWidget;