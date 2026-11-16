import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

const useStomp = (calendarId) => {
    const [messages, setMessages] = useState([]);
    const clientRef = useRef(null);

    useEffect(() => {
        if (!calendarId) return;

        const token = localStorage.getItem('access') || localStorage.getItem('access_token');
        const wsUrl = import.meta.env.VITE_WS_URL || `${window.location.origin}/ws`;

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: token ? {
                Authorization: `Bearer ${token}`
            } : {},
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/calendar/${calendarId}`, (message) => {
                    const parsed = JSON.parse(message.body);
                    setMessages((prev) => [...prev, parsed]);
                });
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
    }, [calendarId]);

    const clearMessages = () => setMessages([]);

    return { messages, clearMessages };
};

export default useStomp;
