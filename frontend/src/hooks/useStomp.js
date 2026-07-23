import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

const useStomp = (calendarId) => {
    const [messages, setMessages] = useState([]);
    const clientRef = useRef(null);

    useEffect(() => {
        if (!calendarId) return;

        const token = localStorage.getItem('access_token');
        const wsUrl = 'http://localhost:8080/ws';

        const client = new Client({
            // Using SockJS fallback since raw websockets might need additional CORS config in dev
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected to WebSockets');
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
