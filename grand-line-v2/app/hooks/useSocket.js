import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// On garde cette constante, elle est très bien pour gérer le localhost si besoin
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useSocket = (session, activeTab, crewId) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // Sécurité : Si pas de session, on ne connecte rien
        if (!session?.user?.id) return;

        // 👇 CORRECTION ICI
        const newSocket = io(SOCKET_URL, { // Utilise SOCKET_URL ici, c'est plus propre
            transports: ['websocket'],
            withCredentials: true,
            query: {
                // ❌ Avant (Erreur) : userId: user?.id 
                // ✅ Après (Correction) : On utilise 'session'
                userId: session.user.id 
            }
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Socket connecté:', newSocket.id);
            newSocket.emit('joinRoom', { room: 'GLOBAL' });
            if (crewId) newSocket.emit('joinRoom', { room: `EQUIPAGE_${crewId}` });
        });

        newSocket.on('connect_error', (err) => console.error('❌ Erreur Socket:', err.message));
        
        newSocket.on('newMessage', (msg) => setMessages((prev) => [...prev, msg]));

        return () => {
            newSocket.disconnect();
        };
    }, [session?.user?.id, crewId]);

    const sendMessageSocket = (txt, pseudo, room, faction) => {
        if (socket && socket.connected) {
            socket.emit('sendMessage', {
                userId: session.user.id,
                pseudo,
                contenu: txt,
                room,
                faction
            });
        }
    };

    return { 
        socket, 
        socketMessages: messages, 
        sendMessageSocket 
    };
};