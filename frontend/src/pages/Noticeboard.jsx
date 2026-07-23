import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Noticeboard.css';

function Noticeboard({ calendarId, canEdit, newStompMessages }) {
    const [notices, setNotices] = useState([]);
    const [content, setContent] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotices();
    }, [calendarId]);

    useEffect(() => {
        // Handle incoming STOMP messages specifically for notices
        if (newStompMessages && newStompMessages.length > 0) {
            const latestMsg = newStompMessages[newStompMessages.length - 1];
            if (latestMsg.type === 'NOTICE_CREATED') {
                setNotices((prev) => [latestMsg.payload, ...prev]);
            } else if (latestMsg.type === 'NOTICE_DELETED') {
                setNotices((prev) => prev.filter(n => n.id !== latestMsg.payload.id));
            }
        }
    }, [newStompMessages]);

    const fetchNotices = async () => {
        try {
            const res = await axios.get(`http://localhost:8080/api/calendars/${calendarId}/notices`);
            setNotices(res.data);
        } catch (err) {
            console.error(err);
            setError('Nie udało się załadować ogłoszeń.');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            await axios.post(`http://localhost:8080/api/calendars/${calendarId}/notices`, { content });
            setContent('');
            // Websocket will handle adding to the list, but we can also refetch if needed
        } catch (err) {
            console.error(err);
            setError('Błąd podczas dodawania ogłoszenia.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8080/api/calendars/${calendarId}/notices/${id}`);
            // Websocket handles removal
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="noticeboard-container">
            <h3>Tablica ogłoszeń</h3>
            {error && <div className="alert alert-danger">{error}</div>}

            {canEdit && (
                <form onSubmit={handleCreate} className="notice-form">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Napisz ogłoszenie (np. Odwołane zajęcia...)"
                        rows="3"
                        required
                    />
                    <button type="submit" className="btn btn-primary btn-sm">Dodaj</button>
                </form>
            )}

            <div className="notices-list">
                {notices.length === 0 ? (
                    <p className="text-muted">Brak ogłoszeń.</p>
                ) : (
                    notices.map(notice => (
                        <div key={notice.id} className="notice-card">
                            <div className="notice-header">
                                <strong>{notice.authorName}</strong>
                                <small>{new Date(notice.createdAt).toLocaleString()}</small>
                            </div>
                            <div className="notice-content">{notice.content}</div>
                            {notice.canEdit && (
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(notice.id)}>
                                    Usuń
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Noticeboard;
