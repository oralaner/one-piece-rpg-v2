import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// 👇 MODIFICATION ICI : Même variable que pour l'API
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useSocket = (session, activeTab, crewId) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!session?.user?.id) return;

        const newSocket = io(process.env.NEXT_PUBLIC_API_URL, {
  transports: ['websocket'], // 👈 OBLIGATOIRE : Force le mode WebSocket direct
  withCredentials: true,     // OBLIGATOIRE : Pour l'auth
  query: {
    userId: user?.id
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