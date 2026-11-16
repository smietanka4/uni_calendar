import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

const useStomp = (calendarId) => {
    const [messages, setMessages] = useState([]);
    const clientRef = useRef(null);
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    useEffect(() => {
        if (!calendarId && !user?.id) return;

        const token = localStorage.getItem('access') || localStorage.getItem('access_token');
        const wsUrl = import.meta.env.VITE_WS_URL || `${window.location.origin}/ws`;

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: token ? {
                Authorization: `Bearer ${token}`
            } : {},
            reconnectDelay: 5000,
            onConnect: () => {
                if (calendarId) {
                    client.subscribe(`/topic/calendar/${calendarId}`, (message) => {
                        const parsed = JSON.parse(message.body);
                        setMessages((prev) => [...prev, parsed]);
                    });
                }
                if (user?.id) {
                    client.subscribe(`/topic/user/${user.id}`, (message) => {
                        const parsed = JSON.parse(message.body);
                        setMessages((prev) => [...prev, parsed]);
                    });
                }
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [calendarId, user?.id]);

    const clearMessages = () => setMessages([]);

    return { messages, clearMessages };
};

export default useStomp;
