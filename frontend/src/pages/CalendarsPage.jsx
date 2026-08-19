import { useState, useEffect } from 'react'
import client from '../api/client'
import './CalendarsPage.css'

export default function CalendarsPage() {
  const [myCalendars, setMyCalendars] = useState([])
  const [subskrypcje, setSubskrypcje] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [joinId, setJoinId] = useState('')
  const [joinHaslo, setJoinHaslo] = useState('')
  const [joining, setJoining] = useState(false)

  const [newHaslo, setNewHaslo] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [savingPass, setSavingPass] = useState(false)

  // Invite state
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteRole, setInviteRole] = useState('COLLABORATOR')
  const [inviting, setInviting] = useState(false)
  const [changingRole, setChangingRole] = useState({})

  // Accordion state – pierwsze rozwinęte, reszta zwinięta
  const [expandedCalendars, setExpandedCalendars] = useState({})

  const toggleCalendar = (calId) => {
    setExpandedCalendars(prev => ({ ...prev, [calId]: !prev[calId] }))
  }

  const flashSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const fetchPlany = async () => {
    try {
      let { data } = await client.get('/calendars')
      let myPlans = data.filter(k => k.czy_wlasciciel)

      // Leniwe tworzenie planu jeśli użytkownik jeszcze nie dodawał zajęć
      if (myPlans.length === 0) {
        const res = await client.post('/calendars', { nazwa: 'Mój Główny Plan', typ: 'PERSONAL' })
        myPlans.push(res.data)
        data.push(res.data)
      }

      setMyCalendars(myPlans)
      setSubskrypcje(data.filter(k => !k.czy_wlasciciel))

      // Inicjalizuj accordion: pierwszy rozwinęty, reszta zwinięta
      setExpandedCalendars(prev => {
        const next = { ...prev }
        myPlans.forEach((cal, i) => {
          if (!(cal.id in next)) next[cal.id] = false
        })
        return next
      })

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
      await client.post('/calendars/join', { id: joinId, haslo: joinHaslo })
      setJoinId('')
      setJoinHaslo('')
      flashSuccess('Dołączono do planu!')
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd dołączania do planu. Może złe hasło?')
    } finally {
      setJoining(false)
    }
  }

  const handleUpdateSettings = async (e, calId, newHaslo, isPublic) => {
    e.preventDefault()
    setSavingPass(true)
    setError('')
    try {
      await client.patch(`/calendars/${calId}`, { haslo: newHaslo, publiczny: isPublic })
      flashSuccess('Ustawienia planu zostały zaktualizowane.')
      fetchPlany()
    } catch {
      setError('Błąd podczas zapisywania ustawień.')
    } finally {
      setSavingPass(false)
    }
  }

  const handleCopyPublicLink = (calId) => {
    const link = `${window.location.origin}/public/${calId}`
    navigator.clipboard.writeText(link)
    flashSuccess('Skopiowano link publiczny!')
  }

  const handleLeave = async (id) => {
    if (!window.confirm('Na pewno przestać obserwować ten plan?')) return
    try {
      await client.post(`/calendars/${id}/leave`)
      fetchPlany()
    } catch {
      setError('Błąd opuszczania planu.')
    }
  }

  const handleInvite = async (e, calId, username, role) => {
    e.preventDefault()
    if (!username.trim()) return
    setInviting(true)
    setError('')
    try {
      const { data } = await client.post(`/calendars/${calId}/invite`, { username, role })
      flashSuccess(data.message)
      setInviteUsername('')
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd zapraszania użytkownika.')
    } finally {
      setInviting(false)
    }
  }

  const handleChangeRole = async (calId, username, newRole) => {
    setChangingRole(prev => ({ ...prev, [username]: true }))
    setError('')
    try {
      const { data } = await client.post(`/calendars/${calId}/change-role`, { username, role: newRole })
      flashSuccess(data.message)
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd zmiany roli.')
    } finally {
      setChangingRole(prev => ({ ...prev, [username]: false }))
    }
  }

  const handleKick = async (calId, username) => {
    if (!window.confirm(`Usunąć użytkownika "${username}" z planu?`)) return
    setError('')
    try {
      const { data } = await client.post(`/calendars/${calId}/kick`, { username })
      flashSuccess(data.message)
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd usuwania użytkownika.')
    }
  }

  const handleCreateCalendar = async () => {
    const nazwa = prompt('Podaj nazwę nowego kalendarza (warstwy):')
    if (!nazwa || !nazwa.trim()) return
    setError('')
    try {
      await client.post('/calendars', { nazwa: nazwa.trim(), typ: 'PERSONAL' })
      flashSuccess('Nowy kalendarz "' + nazwa.trim() + '" został utworzony!')
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd tworzenia kalendarza. Limit to 5 kalendarzy.')
    }
  }

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page calendars-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--primary)'}}>
         &gt; CENTRUM UDOSTĘPNIANIA PLANÓW
      </h1>
      <p className="text-muted text-sm mb-2">
        // Skopiuj swój kod, by udostępnić plan znajomym, lub dodaj kody innych by widzieć ich zajęcia w swoim kalendarzu.
      </p>

      {error && <div className="alert alert-error mb-2">{error}</div>}
      {successMsg && <div className="alert alert-success mb-2">{successMsg}</div>}

      <div className="calendars-grid flex gap-2" style={{ alignItems: 'flex-start' }}>

        {/* Lewa kolumna: Twój Plan */}
        <div className="cal-list w-full flex-col gap-2">

           {myCalendars.map((cal, index) => {
             const isSpace = cal.calendarType === 'SPACE'
             const collaborators = cal.subskrybenci || []
             const isExpanded = expandedCalendars[cal.id] ?? false
             return (
             <div key={cal.id} className="mb-2">
             {/* Accordion header */}
             <button
               onClick={() => toggleCalendar(cal.id)}
               style={{
                 width: '100%',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 padding: '0.6rem 1rem',
                 marginBottom: isExpanded ? '0.5rem' : 0,
                 marginTop: index > 0 ? '0.75rem' : 0,
                 background: 'var(--surface-2)',
                 border: `1px solid ${isExpanded ? 'var(--primary)' : 'var(--border)'}`,
                 borderLeft: `3px solid ${isExpanded ? 'var(--primary)' : 'var(--border-bright)'}`,
                 cursor: 'pointer',
                 transition: 'border-color 0.15s',
               }}
             >
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>// KALENDARZ:</span>
                 <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: isExpanded ? 'var(--primary)' : 'var(--text-bright)' }}>{cal.nazwa}</span>
                 {(collaborators.length > 0) && (
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                     👥 {collaborators.length}
                   </span>
                 )}
               </div>
               <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', fontSize: '0.85rem', transition: 'transform 0.15s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                 ▼
               </span>
             </button>

             {/* Zawartość rozwijana */}
             {isExpanded && (
             <div>
             {/* KARTA KODU */}
             <div className="card w-full mb-1" style={{ borderColor: isSpace ? '#10b981' : 'var(--primary)' }}>
                <h3 className="mb-1" style={{color: isSpace ? '#10b981' : 'var(--primary)'}}>
                  &gt; {isSpace ? `POKÓJ: ${cal.nazwa}` : `TWÓJ PRYWATNY KOD UDOSTĘPNIANIA`}
                </h3>
                <p className="text-muted mb-1 text-sm">Przekaż ten kod znajomym, aby mogli dołączyć do tego {isSpace ? 'Pokoju' : 'planu'}.</p>
                <div className="bg-dark p-1 border-dashed mt-1 flex-between" style={{ alignItems: 'center' }}>
                   <code className="text-bright" style={{ fontSize: '1rem', wordBreak: 'break-all', userSelect: 'all' }}>
                      {cal.id}
                   </code>
                </div>

                <form onSubmit={(e) => handleUpdateSettings(e, cal.id, newHaslo, isPublic)} className="mt-2 pt-1" style={{ borderTop: '1px dashed var(--border)' }}>
                   <div className="flex-col gap-1">
                     <label className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isPublic} 
                          onChange={e => setIsPublic(e.target.checked)} 
                        />
                        <span className="text-sm">Udostępnij publicznie (bez logowania)</span>
                     </label>

                     {isPublic && (
                       <div className="mt-1 flex gap-1 items-center">
                          <code className="text-muted text-sm bg-dark p-1 truncate" style={{flexGrow: 1}}>
                            {window.location.origin}/public/{cal.id}
                          </code>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleCopyPublicLink(cal.id)}>Kopiuj</button>
                       </div>
                     )}

                     <div className="flex gap-1 mt-1" style={{ alignItems: 'flex-end' }}>
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
                   </div>
                </form>
             </div>

             {/* KARTA ZAPROŚ */}
             <div className="card w-full" style={{ borderColor: 'var(--border-bright)' }}>
               <h3 className="mb-1" style={{color: 'var(--primary)'}}>&gt; ZAPROŚ DO {isSpace ? 'POKOJU' : 'SWOJEGO PLANU'}</h3>
               <p className="text-muted text-sm mb-1">
                 Zaproszeni użytkownicy {isSpace ? 'są członkami przestrzeni i widzą wszystkie zajęcia' : 'zobaczą Twoje zajęcia w swoim widoku'}.
               </p>

               <form onSubmit={(e) => handleInvite(e, cal.id, inviteUsername, inviteRole)} className="mt-1">
                 <div className="form-group mb-1">
                   <label>Nazwa Użytkownika</label>
                   <input
                     type="text"
                     value={inviteUsername}
                     onChange={e => setInviteUsername(e.target.value)}
                     placeholder="np. jan_kowalski"
                     required
                   />
                 </div>
                 <div className="flex gap-1" style={{ alignItems: 'center' }}>
                   <select
                     value={inviteRole}
                     onChange={e => setInviteRole(e.target.value)}
                     style={{
                       flex: 1,
                       background: 'var(--surface-2)',
                       color: 'var(--text)',
                       border: '1px solid var(--border)',
                       padding: '0.5rem',
                       fontFamily: 'var(--font-body)',
                     }}
                   >
                     <option value="COLLABORATOR">✏️ Zapis (Write)</option>
                     <option value="FOLLOWER">👁️ Odczyt (Read)</option>
                   </select>
                   <button type="submit" className="btn btn-primary" disabled={inviting}>
                     {inviting ? '...' : 'ZAPROŚ'}
                   </button>
                 </div>
               </form>

               {/* Lista współpracowników */}
               <div className="mt-2 pt-1" style={{ borderTop: '1px dashed var(--border)' }}>
                 <p className="text-muted text-sm mb-1">
                   Osoby z dostępem ({collaborators.length}):
                 </p>
                 {collaborators.length === 0 ? (
                   <p className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                     Nikt jeszcze nie ma dostępu do tego {isSpace ? 'Pokoju' : 'planu'}.
                   </p>
                 ) : (
                   <div className="cal-items">
                     {collaborators.map(u => (
                       <div key={u.id} className="cal-item flex-between p-1 mt-1 border-dashed" style={{ alignItems: 'center', gap: '0.5rem' }}>
                         <div style={{ flex: 1 }}>
                           <span className="text-bright" style={{ fontSize: '0.9rem' }}>@{u.username}</span>
                           <span
                             style={{
                               marginLeft: '0.5rem',
                               fontSize: '0.75rem',
                               padding: '1px 6px',
                               borderRadius: '2px',
                               background: u.role === 'COLLABORATOR' ? 'rgba(59,130,246,0.2)' : 'rgba(100,100,100,0.2)',
                               color: u.role === 'COLLABORATOR' ? 'var(--primary)' : 'var(--text-muted)',
                               border: `1px solid ${u.role === 'COLLABORATOR' ? 'var(--primary)' : 'var(--border)'}`,
                               fontFamily: 'var(--font-display)'
                             }}
                           >
                             {u.role === 'COLLABORATOR' ? '✏️ ZAPIS' : '👁️ ODCZYT'}
                           </span>
                         </div>
                         <div className="flex gap-1">
                           <button
                             className="btn btn-ghost btn-sm"
                             disabled={changingRole[u.username]}
                             onClick={() => handleChangeRole(
                               cal.id,
                               u.username,
                               u.role === 'COLLABORATOR' ? 'FOLLOWER' : 'COLLABORATOR'
                             )}
                             title={u.role === 'COLLABORATOR' ? 'Zmień na tylko odczyt' : 'Nadaj uprawnienia zapisu'}
                           >
                             {changingRole[u.username] ? '...' : (u.role === 'COLLABORATOR' ? '📤 Ogranicz' : '📥 Nadaj zapis')}
                           </button>
                           <button
                             className="btn btn-danger btn-sm"
                             onClick={() => handleKick(cal.id, u.username)}
                             title="Usuń dostęp"
                           >
                             ✖ USUŃ
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
             </div>
             )}
             </div>
             )
           })}

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

        {/* Prawa kolumna: Dołącz do planu przez ID */}
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

            {/* Utwórz nowy kalendarz */}
            <div className="card w-full">
               <h3 className="mb-1" style={{color: 'var(--primary)'}}>&gt; NOWY KALENDARZ (WARSTWA)</h3>
               <p className="text-muted text-sm mb-1">Możesz mieć maks. 5 kalendarzy. Każdy pojawi się jako oddzielna warstwa w widoku tygodnia.</p>
               <button
                 type="button"
                 className="btn btn-ghost w-full mt-1"
                 onClick={handleCreateCalendar}
                 disabled={myCalendars.length >= 5}
               >
                 {myCalendars.length >= 5 ? 'OSIĄGNIĘTO LIMIT (5/5)' : '+ UTWÓRZ NOWY KALENDARZ'}
               </button>
            </div>

        </div>
      </div>
    </div>
  )
}
