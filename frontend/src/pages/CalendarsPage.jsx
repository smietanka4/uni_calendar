import { useState, useEffect } from 'react'
import client from '../api/client'
import './CalendarsPage.css'

export default function CalendarsPage() {
  const [kalendarze, setKalendarze] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newNazwa, setNewNazwa] = useState('')
  const [newHaslo, setNewHaslo] = useState('')
  const [creating, setCreating] = useState(false)

  const [joinId, setJoinId] = useState('')
  const [joinHaslo, setJoinHaslo] = useState('')
  const [joining, setJoining] = useState(false)

  const fetchKalendarze = async () => {
    try {
      const { data } = await client.get('/kalendarze/')
      setKalendarze(data)
    } catch {
      setError('Błąd pobierania grup.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchKalendarze() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newNazwa.trim()) return
    setCreating(true)
    try {
      await client.post('/kalendarze/', { nazwa: newNazwa, haslo: newHaslo })
      setNewNazwa('')
      setNewHaslo('')
      fetchKalendarze()
    } catch {
      setError('Błąd tworzenia grupy.')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinId.trim()) return
    setJoining(true)
    setError('')
    try {
      await client.post('/kalendarze/join/', { id: joinId, haslo: joinHaslo })
      setJoinId('')
      setJoinHaslo('')
      fetchKalendarze()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd dołączania do grupy. Może złe hasło?')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async (id, isOwner) => {
    if (isOwner) return; // Właściciel nie może opuścić
    if (!window.confirm('Na pewno chcesz opuścić tę grupę?')) return
    try {
      await client.post(`/kalendarze/${id}/leave/`)
      fetchKalendarze()
    } catch {
      setError('Błąd opuszczania grupy.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Usunięcie grupy usunie wszystkie przypisane do niej zajęcia wszystkim użytkownikom. Kontynuować?')) return;
    try {
      await client.delete(`/kalendarze/${id}/`)
      fetchKalendarze()
    } catch {
      setError('Błąd usuwania grupy.')
    }
  }

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--primary)'}}>
         &gt; TWOJE GRUPY ZAJĘCIOWE
      </h1>
      <p className="text-muted text-sm mb-2">
        // Zarządzaj współdzielonymi kalendarzami. Możesz edytować i dodawać zajęcia tylko do tych grup, których jesteś właścicielem (Administrator).
      </p>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      <div className="calendars-grid flex gap-2" style={{ alignItems: 'flex-start' }}>
        
        {/* Lewa kolumna: Lista kalendarzy */}
        <div className="cal-list w-full card">
          <h2 className="mb-1" style={{color: 'var(--primary)'}}>LISTA GRUP</h2>
          {kalendarze.length === 0 ? (
            <p className="text-muted mt-1">Brak grup. Stwórz nową lub dołącz do istniejącej!</p>
          ) : (
            <div className="cal-items mt-1">
              {kalendarze.map(k => (
                <div key={k.id} className="cal-item flex-between p-1 mt-1 border-dashed">
                   <div>
                      <div className="cal-item-title text-bright" style={{fontFamily: 'var(--font-display)', fontSize: '1.2rem'}}>{k.nazwa}</div>
                      <div className="cal-item-id text-muted" style={{fontSize: '0.75rem', fontFamily: 'var(--font-body)'}}>
                         ID: <span className="text-bright bg-muted px-1" style={{userSelect: 'all', background: 'rgba(0,0,0,0.5)', padding: '2px 4px'}}>{k.id}</span>
                      </div>
                      <div className="cal-item-role mt-1">
                        {k.czy_wlasciciel 
                          ? <span className="badge badge-pro">👑 ADMINISTRATOR</span>
                          : <span className="badge badge-wyk">👁 SUBSKRYBENT ({k.wlasciciel_nazwa})</span>
                        }
                      </div>
                   </div>
                   <div>
                     {k.czy_wlasciciel ? (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(k.id)} title="Usuń całkowicie z bazy">🗑</button>
                     ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleLeave(k.id, false)} title="Opuść grupę">WYJDŹ</button>
                     )}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prawa kolumna: Akcje (Formularze) */}
        <div className="cal-actions w-full flex-col gap-2" style={{ minWidth: '300px' }}>
           
           {/* Stwórz */}
           <div className="card w-full">
              <h3 className="mb-1" style={{color: 'var(--primary)'}}>+ STWÓRZ NOWĄ GRUPĘ</h3>
              <form onSubmit={handleCreate}>
                 <div className="form-group">
                   <label>Nazwa Grupy *</label>
                   <input type="text" value={newNazwa} onChange={e => setNewNazwa(e.target.value)} placeholder="np. Informatyka Sem 2" required />
                 </div>
                 <div className="form-group mt-1">
                   <label>Hasło (Opcjonalne)</label>
                   <input type="text" value={newHaslo} onChange={e => setNewHaslo(e.target.value)} placeholder="Zostaw puste by grupa była otwarta" />
                 </div>
                 <button type="submit" className="btn btn-primary w-full mt-2" disabled={creating}>
                    {creating ? 'TWORZENIE...' : 'STWÓRZ GRUPĘ'}
                 </button>
              </form>
           </div>

           {/* Dołącz */}
           <div className="card w-full">
              <h3 className="mb-1" style={{color: 'var(--primary)'}}>&gt; DOŁĄCZ DO GRUPY</h3>
              <form onSubmit={handleJoin}>
                 <div className="form-group">
                   <label>ID Grupy *</label>
                   <input type="text" value={joinId} onChange={e => setJoinId(e.target.value)} placeholder="Wklej UUID udostępnione przez znajomego" required />
                 </div>
                 <div className="form-group mt-1">
                   <label>Hasło (Jeśli wymagane)</label>
                   <input type="text" value={joinHaslo} onChange={e => setJoinHaslo(e.target.value)} placeholder="Hasło dostępowe" />
                 </div>
                 <button type="submit" className="btn btn-ghost w-full mt-2" style={{borderColor: 'var(--primary)'}} disabled={joining}>
                    {joining ? 'DOŁĄCZANIE...' : 'DOŁĄCZ'}
                 </button>
              </form>
           </div>
           
        </div>
      </div>
    </div>
  )
}
