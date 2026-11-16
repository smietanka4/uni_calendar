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

  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteRole, setInviteRole] = useState('COLLABORATOR')
  const [inviting, setInviting] = useState(false)
  const [changingRole, setChangingRole] = useState({})

  const [expandedCalendars, setExpandedCalendars] = useState({})

  const toggleCalendar = (calId) => {
    setExpandedCalendars((prev) => ({ ...prev, [calId]: !prev[calId] }))
  }

  const flashSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const fetchPlany = async () => {
    try {
      const { data } = await client.get('/calendars')
      let myPlans = data.filter((k) => k.czy_wlasciciel)

      if (myPlans.length === 0) {
        const res = await client.post('/calendars', { nazwa: 'Mój Główny Plan', typ: 'PERSONAL' })
        myPlans.push(res.data)
        data.push(res.data)
      }

      setMyCalendars(myPlans)
      setSubskrypcje(data.filter((k) => !k.czy_wlasciciel))

      setExpandedCalendars((prev) => {
        const next = { ...prev }
        myPlans.forEach((cal) => {
          if (!(cal.id in next)) next[cal.id] = false
        })
        return next
      })
    } catch {
      setError('Błąd pobierania danych o kalendarzach.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlany()
  }, [])

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinId.trim()) return
    setJoining(true)
    setError('')
    try {
      await client.post('/calendars/join', { id: joinId, haslo: joinHaslo })
      setJoinId('')
      setJoinHaslo('')
      flashSuccess('Dołączono do wybranego planu zajęć.')
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Nie udało się dołączyć do planu. Sprawdź identyfikator i hasło.')
    } finally {
      setJoining(false)
    }
  }

  const handleUpdateSettings = async (e, calId, passVal, publicVal) => {
    e.preventDefault()
    setSavingPass(true)
    setError('')
    try {
      await client.patch(`/calendars/${calId}`, { haslo: passVal, publiczny: publicVal })
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
    flashSuccess('Skopiowano link publiczny do schowka.')
  }

  const handleLeave = async (id) => {
    if (!window.confirm('Czy na pewno chcesz przestać obserwować ten plan?')) return
    try {
      await client.post(`/calendars/${id}/leave`)
      fetchPlany()
    } catch {
      setError('Błąd podczas odłączania obserwowanego planu.')
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
      setError(err.response?.data?.error || 'Błąd podczas zapraszania użytkownika.')
    } finally {
      setInviting(false)
    }
  }

  const handleChangeRole = async (calId, username, newRole) => {
    setChangingRole((prev) => ({ ...prev, [username]: true }))
    setError('')
    try {
      const { data } = await client.put(`/calendars/${calId}/members/${username}/role`, { role: newRole })
      flashSuccess(data.message)
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zmiany uprawnień.')
    } finally {
      setChangingRole((prev) => ({ ...prev, [username]: false }))
    }
  }

  const handleKick = async (calId, username) => {
    if (!window.confirm(`Odebrać dostęp użytkownikowi "${username}"?`)) return
    setError('')
    try {
      const { data } = await client.post(`/calendars/${calId}/kick`, { username })
      flashSuccess(data.message)
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas usuwania użytkownika z planu.')
    }
  }

  const handleCreateCalendar = async () => {
    const nazwa = prompt('Podaj nazwę nowego kalendarza (np. Grupa laboratoryjna):')
    if (!nazwa || !nazwa.trim()) return
    try {
      await client.post('/calendars', { nazwa: nazwa.trim(), typ: 'PERSONAL' })
      flashSuccess('Utworzono nowy kalendarz.')
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Nie udało się utworzyć kalendarza.')
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page calendars-page" style={{ maxWidth: '1040px', margin: '0 auto' }}>
      <h1 className="mb-1">Współdzielenie planów i grupy</h1>
      <p className="text-muted text-sm mb-2">
        Zarządzaj własnymi kalendarzami, udostępniaj je innym lub dołączaj do planów znajomych.
      </p>

      {error && <div className="alert alert-error mb-2">{error}</div>}
      {successMsg && <div className="alert alert-success mb-2">{successMsg}</div>}

      <div className="calendars-grid flex gap-2" style={{ alignItems: 'flex-start' }}>
        <div className="cal-list w-full flex-col gap-2">
          {myCalendars.map((cal) => {
            const isExpanded = expandedCalendars[cal.id]
            const collaborators = cal.subskrybenci_lista || []

            return (
              <div key={cal.id} className="card w-full">
                <div
                  className="flex-between"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleCalendar(cal.id)}
                >
                  <div>
                    <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {cal.nazwa}
                      {cal.typ && <span className="badge badge-inn">{cal.typ}</span>}
                      {cal.publiczny && <span className="badge badge-lab">Publiczny</span>}
                    </h3>
                    <p className="text-muted text-sm mt-1">
                      {collaborators.length} {collaborators.length === 1 ? 'obserwator' : 'obserwatorów'}
                    </p>
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm">
                    {isExpanded ? 'Zwiń' : 'Rozwiń'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-muted mb-1 text-sm">Identyfikator planu (UUID):</p>
                    <div className="bg-dark p-1 border-dashed flex-between" style={{ alignItems: 'center' }}>
                      <code className="text-bright" style={{ fontSize: '0.88rem', wordBreak: 'break-all', userSelect: 'all' }}>
                        {cal.id}
                      </code>
                    </div>

                    <form
                      onSubmit={(e) => handleUpdateSettings(e, cal.id, newHaslo || cal.haslo, isPublic)}
                      className="mt-2 pt-1"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <div className="form-group mb-1">
                        <label htmlFor={`pass-${cal.id}`}>Hasło dostępowe</label>
                        <input
                          id={`pass-${cal.id}`}
                          type="text"
                          defaultValue={cal.haslo || ''}
                          onChange={(e) => setNewHaslo(e.target.value)}
                          placeholder="Pozostaw puste dla planu otwartego"
                        />
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <input
                          type="checkbox"
                          id={`public-${cal.id}`}
                          defaultChecked={cal.publiczny}
                          onChange={(e) => setIsPublic(e.target.checked)}
                        />
                        <label htmlFor={`public-${cal.id}`} style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                          Udostępnij jako widok publiczny (dostępny bez logowania)
                        </label>
                      </div>
                      <div className="flex gap-1">
                        <button type="submit" className="btn btn-ghost btn-sm" disabled={savingPass}>
                          {savingPass ? '...' : 'Zapisz ustawienia'}
                        </button>
                        {cal.publiczny && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleCopyPublicLink(cal.id)}
                          >
                            Kopiuj link publiczny
                          </button>
                        )}
                      </div>
                    </form>

                    <div className="mt-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <h4 className="mb-1 text-sm" style={{ color: 'var(--text-bright)' }}>
                        Zaproś użytkownika do tego planu
                      </h4>
                      <form
                        onSubmit={(e) => handleInvite(e, cal.id, inviteUsername, inviteRole)}
                        className="mt-1 flex gap-1"
                        style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}
                      >
                        <div className="form-group mb-0" style={{ flex: 1, minWidth: '150px' }}>
                          <label>Użytkownik</label>
                          <input
                            type="text"
                            value={inviteUsername}
                            onChange={(e) => setInviteUsername(e.target.value)}
                            placeholder="np. jan.kowalski"
                          />
                        </div>
                        <div className="form-group mb-0" style={{ width: '140px' }}>
                          <label>Rola</label>
                          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                            <option value="COLLABORATOR">Współtwórca</option>
                            <option value="FOLLOWER">Obserwator</option>
                          </select>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={inviting}>
                          {inviting ? '...' : 'Dodaj'}
                        </button>
                      </form>

                      <div className="mt-2">
                        <p className="text-muted text-sm mb-1">
                          Użytkownicy z dostępem ({collaborators.length}):
                        </p>
                        {collaborators.length === 0 ? (
                          <p className="text-muted text-sm">Brak przypisanych członków.</p>
                        ) : (
                          <div className="cal-items">
                            {collaborators.map((u) => (
                              <div
                                key={u.id}
                                className="cal-item flex-between p-1 mt-1"
                                style={{ alignItems: 'center', gap: '0.5rem' }}
                              >
                                <div style={{ flex: 1 }}>
                                  <span className="text-bright" style={{ fontSize: '0.9rem' }}>
                                    @{u.username}
                                  </span>
                                  <span
                                    className={`badge ${u.role === 'COLLABORATOR' ? 'badge-cwi' : 'badge-inn'}`}
                                    style={{ marginLeft: '0.5rem' }}
                                  >
                                    {u.role === 'COLLABORATOR' ? 'ZAPIS' : 'ODCZYT'}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={changingRole[u.username]}
                                    onClick={() =>
                                      handleChangeRole(
                                        cal.id,
                                        u.username,
                                        u.role === 'COLLABORATOR' ? 'FOLLOWER' : 'COLLABORATOR'
                                      )
                                    }
                                  >
                                    {changingRole[u.username]
                                      ? '...'
                                      : u.role === 'COLLABORATOR'
                                      ? 'Ogranicz do odczytu'
                                      : 'Nadaj zapis'}
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleKick(cal.id, u.username)}
                                  >
                                    Usuń
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

          <div className="card w-full">
            <h3 className="mb-1" style={{ color: 'var(--primary)' }}>
              Obserwowane plany innych użytkowników
            </h3>
            {subskrypcje.length === 0 ? (
              <p className="text-muted text-sm mt-1">Nie obserwujesz obecnie żadnych zewnętrznych planów.</p>
            ) : (
              <div className="cal-items mt-1">
                {subskrypcje.map((k) => (
                  <div key={k.id} className="cal-item flex-between p-1 mt-1">
                    <div>
                      <div className="cal-item-title text-bright">
                        {k.nazwa} ({k.wlasciciel_nazwa})
                      </div>
                    </div>
                    <div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleLeave(k.id)}
                        title="Przestań obserwować"
                      >
                        Opuść
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="cal-actions w-full flex-col gap-2" style={{ minWidth: '300px' }}>
          <div className="card w-full">
            <h3 className="mb-1" style={{ color: 'var(--primary)' }}>
              Dołącz do planu przez kod
            </h3>
            <p className="text-muted text-sm mb-1">
              Wprowadź kod planu udostępniony przez inną osobę, aby nałożyć go na swój harmonogram.
            </p>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label htmlFor="join-id">Identyfikator planu (UUID) *</label>
                <input
                  id="join-id"
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  required
                />
              </div>
              <div className="form-group mt-1">
                <label htmlFor="join-pass">Hasło dostępowe (opcjonalnie)</label>
                <input
                  id="join-pass"
                  type="text"
                  value={joinHaslo}
                  onChange={(e) => setJoinHaslo(e.target.value)}
                  placeholder="Jeśli wymagane"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2" disabled={joining}>
                {joining ? 'Dołączanie...' : 'Dołącz do planu'}
              </button>
            </form>
          </div>

          <div className="card w-full">
            <h3 className="mb-1" style={{ color: 'var(--primary)' }}>
              Nowy kalendarz (warstwa)
            </h3>
            <p className="text-muted text-sm mb-1">
              Możesz utworzyć maksymalnie 5 własnych kalendarzy. Każdy pojawi się jako osobna warstwa w widoku tygodnia.
            </p>
            <button
              type="button"
              className="btn btn-ghost w-full mt-1"
              onClick={handleCreateCalendar}
              disabled={myCalendars.length >= 5}
            >
              {myCalendars.length >= 5 ? 'Osiągnięto limit (5/5)' : 'Utwórz nowy kalendarz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
