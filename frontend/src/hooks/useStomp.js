import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

const useStomp = (calendarId) => {
    const [messages, setMessages] = useState([]);
    const clientRef = useRef(null);
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

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
                if (calendarId) {
                    client.subscribe(`/topic/calendar/${calendarId}`, (message) => {
                        const parsed = JSON.parse(message.body);
                        setMessages((prev) => [...prev, parsed]);
                    });
                }
                if (user?.id) {
                    client.subscribe(`/topic/user/${user.id}`, (message) => {
                        const parsed = JSON.parse(message.body);
                        // Instead of pushing to general messages which are used for grid updates,
                        // we will just fire a custom event or push it with a specific type.
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
    }, [calendarId]);

    const clearMessages = () => setMessages([]);

    return { messages, clearMessages };
};

export default useStomp;
