import { useState, useEffect } from 'react'
import client from '../api/client'
import './CalendarsPage.css'

export default function CalendarsPage() {
  const [mójKalendarz, setMójKalendarz] = useState(null)
  const [subskrypcje, setSubskrypcje] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [joinId, setJoinId] = useState('')
  const [joinHaslo, setJoinHaslo] = useState('')
  const [joining, setJoining] = useState(false)

  const [newHaslo, setNewHaslo] = useState('')
  const [savingPass, setSavingPass] = useState(false)

  const fetchPlany = async () => {
    try {
      let { data } = await client.get('/kalendarze/')
      let myPlan = data.find(k => k.czy_wlasciciel)
      
      // Leniwe tworzenie planu jeśli użytkownik jeszcze nie dodawał zajęć
      if (!myPlan) {
        const res = await client.post('/kalendarze/', { nazwa: 'Plan Zajęć' })
        myPlan = res.data
        data.push(myPlan)
      }
      
      setMójKalendarz(myPlan)
      setNewHaslo(myPlan.haslo || '') // pre-fill
      setSubskrypcje(data.filter(k => !k.czy_wlasciciel))
      
    } catch {
      setError('Błąd pobierania planów.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlany() }, [])

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinId.trim()) return
    setJoining(true)
    setError('')
    try {
      await client.post('/kalendarze/join/', { id: joinId, haslo: joinHaslo })
      setJoinId('')
      setJoinHaslo('')
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd dołączania do planu. Może złe hasło?')
    } finally {
      setJoining(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setSavingPass(true)
    setError('')
    try {
      await client.patch(`/kalendarze/${mójKalendarz.id}/`, { haslo: newHaslo })
      fetchPlany() // odśwież
    } catch {
      setError('Błąd podczas zmiany hasła do planu.')
    } finally {
      setSavingPass(false)
    }
  }

  const handleLeave = async (id) => {
    if (!window.confirm('Na pewno przestać obserwować ten plan?')) return
    try {
      await client.post(`/kalendarze/${id}/leave/`)
      fetchPlany()
    } catch {
      setError('Błąd opuszczania planu.')
    }
  }

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--primary)'}}>
         &gt; CENTRUM UDOSTĘPNIANIA PLANÓW
      </h1>
      <p className="text-muted text-sm mb-2">
        // Skopiuj swój kod, by udostępnić plan znajomym, lub dodaj kody innych by widzieć ich zajęcia w swoim kalendarzu.
      </p>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      <div className="calendars-grid flex gap-2" style={{ alignItems: 'flex-start' }}>
        
        {/* Lewa kolumna: Twój Plan */}
        <div className="cal-list w-full flex-col gap-2">
           
           {/* KARTA TWOJEGO KODU */}
           {mójKalendarz && (
             <div className="card w-full" style={{ borderColor: 'var(--primary)' }}>
                <h3 className="mb-1" style={{color: 'var(--primary)'}}>&gt; TWÓJ PRYWATNY KOD UDOSTĘPNIANIA</h3>
                <p className="text-muted mb-1 text-sm">Przekaż ten kod znajomym, aby mogli nałożyć Twoje zajęcia na ich własny widok.</p>
                <div className="bg-dark p-1 border-dashed mt-1 flex-between" style={{ alignItems: 'center' }}>
                   <code className="text-bright" style={{ fontSize: '1rem', wordBreak: 'break-all', userSelect: 'all' }}>
                      {mójKalendarz.id}
                   </code>
                </div>

                <form onSubmit={handleUpdatePassword} className="mt-2 pt-1" style={{ borderTop: '1px dashed var(--border)' }}>
                   <p className="text-muted text-sm mb-1">Możesz zabezpieczyć udostępnianie hasłem:</p>
                   <div className="flex gap-1" style={{ alignItems: 'flex-end' }}>
                     <div className="form-group w-full mb-0">
                       <label>Zmień Hasło Dostępowe</label>
                       <input 
                         type="text" 
                         value={newHaslo} 
                         onChange={e => setNewHaslo(e.target.value)} 
                         placeholder="Zostaw puste dla publicznego..." 
                       />
                     </div>
                     <button type="submit" className="btn btn-ghost" disabled={savingPass}>
                       {savingPass ? '...' : 'ZAPISZ'}
                     </button>
                   </div>
                </form>
             </div>
           )}

           {/* KARTA ZASUBSKRYBOWANYCH PLANÓW */}
           <div className="card w-full">
             <h3 className="mb-1" style={{color: 'var(--primary)'}}>OBSERWOWANE PLANY INNYCH</h3>
             {subskrypcje.length === 0 ? (
                <p className="text-muted mt-1">Obecnie nie obserwujesz żadnych innych planów.</p>
             ) : (
                <div className="cal-items mt-1">
                  {subskrypcje.map(k => (
                    <div key={k.id} className="cal-item flex-between p-1 mt-1 border-dashed">
                       <div>
                          <div className="cal-item-title text-bright">{k.nazwa} ({k.wlasciciel_nazwa})</div>
                       </div>
                       <div>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleLeave(k.id)} title="Przestań obserwować">✖ UKRYJ</button>
                       </div>
                    </div>
                  ))}
                </div>
             )}
           </div>

        </div>

        {/* Prawa kolumna: Akcje (Formularze) */}
        <div className="cal-actions w-full flex-col gap-2" style={{ minWidth: '300px' }}>
           
           {/* Dołącz */}
           <div className="card w-full">
              <h3 className="mb-1" style={{color: 'var(--primary)'}}>&gt; DODAJ KOD ZNAJOMEGO</h3>
              <p className="text-muted text-sm mb-1">Po udanym podłączeniu, zajęcia wpadną na Twój widok główny jako READ-ONLY.</p>
              <form onSubmit={handleJoin}>
                 <div className="form-group">
                   <label>Wklej Kod (ID) *</label>
                   <input type="text" value={joinId} onChange={e => setJoinId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" required />
                 </div>
                 <div className="form-group mt-1">
                   <label>Hasło (Jeśli wymagane)</label>
                   <input type="text" value={joinHaslo} onChange={e => setJoinHaslo(e.target.value)} placeholder="Opcjonalnie" />
                 </div>
                 <button type="submit" className="btn btn-primary w-full mt-2" disabled={joining}>
                    {joining ? 'WYSZUKIWANIE...' : 'POBIERZ PLAN'}
                 </button>
              </form>
           </div>
           
        </div>
      </div>
    </div>
  )
}
