import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import './Noticeboard.css'

function Noticeboard({ calendarId, canEdit, newStompMessages }) {
  const [notices, setNotices] = useState([])
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)

  const fetchNotices = useCallback(async () => {
    if (!calendarId) return
    try {
      const res = await client.get(`/calendars/${calendarId}/notices`)
      setNotices(res.data)
    } catch {
      setError('Nie udało się pobrać ogłoszeń grupy.')
    }
  }, [calendarId])

  useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  useEffect(() => {
    if (newStompMessages && newStompMessages.length > 0) {
      const latestMsg = newStompMessages[newStompMessages.length - 1]
      if (latestMsg.type === 'NOTICE_CREATED') {
        setNotices((prev) => [latestMsg.payload, ...prev])
      } else if (latestMsg.type === 'NOTICE_DELETED') {
        setNotices((prev) => prev.filter((n) => n.id !== latestMsg.payload.id))
      }
    }
  }, [newStompMessages])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setError(null)

    try {
      await client.post(`/calendars/${calendarId}/notices`, { content })
      setContent('')
    } catch {
      setError('Błąd podczas publikowania ogłoszenia.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await client.delete(`/calendars/${calendarId}/notices/${id}`)
    } catch {
      setError('Nie udało się usunąć ogłoszenia.')
    }
  }

  return (
    <div className="noticeboard-container">
      <h3>Tablica ogłoszeń</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      {canEdit && (
        <form onSubmit={handleCreate} className="notice-form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Wpisz komunikat dla grupy (np. zmiana sali lub odwołane zajęcia)..."
            rows="3"
            required
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Opublikuj
          </button>
        </form>
      )}

      <div className="notices-list">
        {notices.length === 0 ? (
          <p className="text-muted text-sm">Brak opublikowanych ogłoszeń.</p>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="notice-card">
              <div className="notice-header">
                <strong>{notice.authorName}</strong>
                <small>{new Date(notice.createdAt).toLocaleString('pl-PL')}</small>
              </div>
              <div className="notice-content">{notice.content}</div>
              {notice.canEdit && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(notice.id)}
                >
                  Usuń
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Noticeboard
