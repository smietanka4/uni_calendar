import { useState, useEffect } from 'react'
import client from '../api/client'
import useStomp from '../hooks/useStomp'
import './FeedPage.css'

export default function FeedPage() {
  const [feed, setFeed] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  // Opcjonalnie nasłuchiwanie na /topic/feed/{userId} - ale my wysyłamy na /topic/feed/calendar/{calId} w backendzie.
  // Aby odbierać wszystko ze wszystkich swoich kalendarzy musielibyśmy subskrybować każdy kalendarz z osobna w komponencie,
  // lub backend powinien wysyłać na /topic/feed/user/{userId}. Uprościmy to narazie odświeżaniem, 
  // lub po prostu dodamy subskrypcje na wszystkie posiadane kalendarze.

  const fetchFeed = async (pageNum = 0, append = false) => {
    setLoading(true)
    try {
      const { data } = await client.get(`/feed?page=${pageNum}&size=20`)
      if (append) {
        setFeed(prev => [...prev, ...data.content])
      } else {
        setFeed(data.content)
      }
      setHasMore(!data.last)
      setPage(pageNum)
    } catch (err) {
      console.error(err)
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
      alert('Zajęcia zostały pomyślnie dodane do Twojego głównego planu!')
    } catch (err) {
      alert('Błąd podczas kopiowania zajęć.')
    }
  }

  const renderMetadata = (metadataJson) => {
    if (!metadataJson) return null;
    try {
      const meta = JSON.parse(metadataJson);
      return (
        <div className="feed-meta">
          {Object.entries(meta).map(([k, v]) => (
            <span key={k} className="badge bg-dark mr-1">{k}: {v}</span>
          ))}
        </div>
      )
    } catch {
      return null;
    }
  }

  const getVerbIcon = (verb) => {
    switch(verb) {
      case 'CREATED': return '🟢';
      case 'UPDATED': return '🟡';
      case 'DELETED': return '🔴';
      case 'JOINED': return '🤝';
      default: return '⚪';
    }
  }

  return (
    <div className="page feed-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--primary)'}}>
         &gt; THE FEED
      </h1>
      <p className="text-muted text-sm mb-3">
        // Strumień aktywności z kalendarzy, które współdzielisz lub obserwujesz.
      </p>

      <div className="feed-list flex-col gap-2">
        {feed.map(event => (
          <div key={event.id} className="feed-item card p-2" style={{ borderColor: 'var(--border-bright)' }}>
            <div className="flex-between">
              <div className="feed-actor text-bright">
                {getVerbIcon(event.verb)} @{event.actor_name}
              </div>
              <div className="feed-time text-muted text-sm">
                {new Date(event.created_at).toLocaleString('pl-PL')}
              </div>
            </div>
            
            <div className="feed-content mt-1 flex-between">
              <div>
                <span className="text-muted mr-1">{event.verb}</span> 
                <span className="text-bright">{event.target_type}</span>
                <span className="text-muted ml-1">w kalendarzu</span> 
                <span className="text-primary ml-1">[{event.calendar_name}]</span>
              </div>
              
              {event.target_type === 'COURSE' && event.verb === 'CREATED' && (
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => handleFork(event.target_id)}
                  title="Skopiuj to pojedyncze wydarzenie do swojego głównego planu"
                >
                  ➕ DODAJ DO PLANU
                </button>
              )}
            </div>

            {renderMetadata(event.metadata)}
          </div>
        ))}

        {feed.length === 0 && !loading && (
          <p className="text-muted text-center mt-2">Brak aktywności.</p>
        )}

        {hasMore && (
          <button className="btn btn-ghost w-full mt-2" onClick={handleLoadMore} disabled={loading}>
            {loading ? 'ŁADOWANIE...' : 'ZOBACZ WIĘCEJ ↓'}
          </button>
        )}
      </div>
    </div>
  )
}
