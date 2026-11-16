import { useState, useEffect } from 'react'
import client from '../api/client'
import './FeedPage.css'

export default function FeedPage() {
  const [feed, setFeed] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')

  const fetchFeed = async (pageNum = 0, append = false) => {
    setLoading(true)
    try {
      const { data } = await client.get(`/feed?page=${pageNum}&size=20`)
      if (append) {
        setFeed((prev) => [...prev, ...data.content])
      } else {
        setFeed(data.content)
      }
      setHasMore(!data.last)
      setPage(pageNum)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed()
  }, [])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchFeed(page + 1, true)
    }
  }

  const handleFork = async (courseId) => {
    try {
      await client.post(`/courses/${courseId}/fork`)
      setFeedback('Zajęcia zostały pomyślnie skopiowane do Twojego głównego planu.')
      setTimeout(() => setFeedback(''), 4000)
    } catch {
      setFeedback('Błąd podczas kopiowania zajęć.')
    }
  }

  const renderMetadata = (metadataJson) => {
    if (!metadataJson) return null
    try {
      const meta = JSON.parse(metadataJson)
      return (
        <div className="feed-meta mt-1">
          {Object.entries(meta).map(([k, v]) => (
            <span key={k} className="badge badge-inn" style={{ marginRight: '0.4rem' }}>
              {k}: {v}
            </span>
          ))}
        </div>
      )
    } catch {
      return null
    }
  }

  const getVerbBadge = (verb) => {
    switch (verb) {
      case 'CREATED':
        return <span className="badge badge-lab">Utworzono</span>
      case 'UPDATED':
        return <span className="badge badge-cwi">Zaktualizowano</span>
      case 'DELETED':
        return <span className="badge badge-inn">Usunięto</span>
      case 'JOINED':
        return <span className="badge badge-sem">Dołączono</span>
      default:
        return <span className="badge badge-inn">{verb}</span>
    }
  }

  return (
    <div className="page feed-page" style={{ maxWidth: '860px', margin: '0 auto' }}>
      <h1 className="mb-1">Strumień aktywności</h1>
      <p className="text-muted text-sm mb-2">
        Rejestr zmian i aktualizacji z kalendarzy, które współdzielisz lub obserwujesz.
      </p>

      {feedback && <div className="alert alert-success mb-2">{feedback}</div>}

      <div className="feed-list flex-col gap-2">
        {feed.map((event) => (
          <div key={event.id} className="feed-item card p-2">
            <div className="flex-between">
              <div className="feed-actor text-bright flex items-center gap-1">
                {getVerbBadge(event.verb)}
                <span className="ml-1" style={{ fontWeight: 600 }}>@{event.actor_name}</span>
              </div>
              <div className="feed-time text-muted text-sm">
                {new Date(event.created_at).toLocaleString('pl-PL')}
              </div>
            </div>

            <div className="feed-content mt-1 flex-between" style={{ alignItems: 'center' }}>
              <div>
                <span className="text-bright">{event.target_type}</span>
                <span className="text-muted" style={{ marginLeft: '0.4rem' }}>w kalendarzu</span>
                <span className="text-primary" style={{ marginLeft: '0.4rem', fontWeight: 600 }}>
                  [{event.calendar_name}]
                </span>
              </div>

              {event.target_type === 'COURSE' && event.verb === 'CREATED' && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleFork(event.target_id)}
                  title="Skopiuj to pojedyncze wydarzenie do swojego głównego planu"
                >
                  Dodaj do planu
                </button>
              )}
            </div>

            {renderMetadata(event.metadata)}
          </div>
        ))}

        {feed.length === 0 && !loading && (
          <p className="text-muted text-center mt-2">Brak zarejestrowanych aktywności.</p>
        )}

        {hasMore && (
          <button className="btn btn-ghost w-full mt-2" onClick={handleLoadMore} disabled={loading}>
            {loading ? 'Ładowanie...' : 'Wczytaj więcej'}
          </button>
        )}
      </div>
    </div>
  )
}
