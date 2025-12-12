import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

// 👇 MODIFICATION ICI : On utilise la variable d'environnement
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
    baseURL: API_URL, 
});

// Intercepteur : Ajoute le token avant chaque requête
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Intercepteur : Gestion simplifiée des réponses
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || "Erreur serveur";
        return Promise.reject({ message });
    }
);