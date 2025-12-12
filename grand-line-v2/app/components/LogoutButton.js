import React from 'react';
import { supabase } from '../lib/supabaseClient';

const LogoutButton = () => {
    
    const handleLogout = async () => {
        // 1. Déconnexion Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error("Erreur lors de la déconnexion:", error);
        }

        // 2. On force le rechargement pour vider tous les états React (Inventaire, Joueur, etc.)
        // C'est la méthode la plus sûre pour éviter les bugs de cache.
        window.location.reload();
    };

    return (
        <button 
            onClick={handleLogout}
            className="group flex items-center gap-2 px-4 py-2 bg-red-900/40 border border-red-500/50 hover:bg-red-600 hover:border-red-400 text-red-200 hover:text-white rounded-lg transition-all duration-300 shadow-lg active:scale-95"
            title="Se déconnecter"
        >
            <span className="text-lg group-hover:-translate-x-1 transition-transform">🚪</span>
            <span className="font-bold uppercase text-xs tracking-widest hidden md:inline">Quitter</span>
        </button>
    );
};

export default LogoutButton;