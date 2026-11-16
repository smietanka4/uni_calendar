import { useState, useEffect } from 'react'
import client from '../api/client'
import './CalendarsPage.css'

export default function CalendarsPage() {
  const [mójKalendarz, setMójKalendarz] = useState(null)
  const [subskrypcje, setSubskrypcje] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [joinId, setJoinId] = useState('')
  const [joinHaslo, setJoinHaslo] = useState('')
  const [joining, setJoining] = useState(false)

  const [newHaslo, setNewHaslo] = useState('')
  const [savingPass, setSavingPass] = useState(false)

  const [inviteUsername, setInviteUsername] = useState('')
  const [inviting, setInviting] = useState(false)

  const flashSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const fetchPlany = async () => {
    try {
      const { data } = await client.get('/calendars')
      let myPlan = data.find((k) => k.czy_wlasciciel)

      if (!myPlan) {
        const res = await client.post('/calendars', { nazwa: 'Plan Zajęć' })
        myPlan = res.data
        data.push(myPlan)
      }

      setMójKalendarz(myPlan)
      setNewHaslo(myPlan.haslo || '')
      setSubskrypcje(data.filter((k) => !k.czy_wlasciciel))
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

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setSavingPass(true)
    setError('')
    try {
      await client.patch(`/calendars/${mójKalendarz.id}`, { haslo: newHaslo })
      flashSuccess('Hasło dostępowe planu zostało zaktualizowane.')
      fetchPlany()
    } catch {
      setError('Błąd podczas aktualizacji hasła planu.')
    } finally {
      setSavingPass(false)
    }
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

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteUsername.trim()) return
    setInviting(true)
    setError('')
    try {
      const { data } = await client.post(`/calendars/${mójKalendarz.id}/invite`, {
        username: inviteUsername,
      })
      setInviteUsername('')
      flashSuccess(data.message)
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapraszania użytkownika.')
    } finally {
      setInviting(false)
    }
  }

  const handleKick = async (username) => {
    if (!window.confirm(`Odebrać dostęp użytkownikowi "${username}"?`)) return
    setError('')
    try {
      const { data } = await client.post(`/calendars/${mójKalendarz.id}/kick`, { username })
      flashSuccess(data.message)
      fetchPlany()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas usuwania użytkownika z planu.')
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="spinner" />
      </div>
    )
  }

  const collaborators = mójKalendarz?.subskrybenci_lista || []

  return (
    <div className="page calendars-page" style={{ maxWidth: '1040px', margin: '0 auto' }}>
      <h1 className="mb-1">Współdzielenie planów i grupy</h1>
      <p className="text-muted text-sm mb-2">
        Udostępnij identyfikator swojego planu innym osobom z roku lub nałóż plany innych grup na swój widok tygodniowy.
      </p>

      {error && <div className="alert alert-error mb-2">{error}</div>}
      {successMsg && <div className="alert alert-success mb-2">{successMsg}</div>}

      <div className="calendars-grid flex gap-2" style={{ alignItems: 'flex-start' }}>
        <div className="cal-list w-full flex-col gap-2">
          {mójKalendarz && (
            <div className="card w-full">
              <h3 className="mb-1" style={{ color: 'var(--primary)' }}>
                Identyfikator Twojego planu
              </h3>
              <p className="text-muted mb-1 text-sm">
                Przekaż poniższy kod znajomym, aby mogli obserwować Twoje zajęcia na własnej siatce tygodniowej.
              </p>
              <div className="bg-dark p-1 border-dashed mt-1 flex-between" style={{ alignItems: 'center' }}>
                <code className="text-bright" style={{ fontSize: '0.92rem', wordBreak: 'break-all', userSelect: 'all' }}>
                  {mójKalendarz.id}
                </code>
              </div>

              <form onSubmit={handleUpdatePassword} className="mt-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-muted text-sm mb-1">Opcjonalne hasło wymagane przy dołączaniu przez kod:</p>
                <div className="flex gap-1" style={{ alignItems: 'flex-end' }}>
                  <div className="form-group w-full mb-0">
                    <label htmlFor="plan-pass">Hasło dostępowe</label>
                    <input
                      id="plan-pass"
                      type="text"
                      value={newHaslo}
                      onChange={(e) => setNewHaslo(e.target.value)}
                      placeholder="Pozostaw puste, jeśli plan nie wymaga hasła"
                    />
                  </div>
                  <button type="submit" className="btn btn-ghost" disabled={savingPass}>
                    {savingPass ? '...' : 'Zapisz'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {mójKalendarz && (
            <div className="card w-full">
              <h3 className="mb-1" style={{ color: 'var(--primary)' }}>
                Zaproś użytkownika po loginie
              </h3>
              <p className="text-muted text-sm mb-1">
                Dodani użytkownicy otrzymają dostęp do odczytu Twojego planu zajęć.
              </p>

              <form onSubmit={handleInvite} className="mt-1">
                <div className="flex gap-1" style={{ alignItems: 'flex-end' }}>
                  <div className="form-group w-full mb-0">
                    <label htmlFor="invite-user">Nazwa użytkownika</label>
                    <input
                      id="invite-user"
                      type="text"
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      placeholder="np. jan.kowalski"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={inviting}>
                    {inviting ? '...' : 'Zaproś'}
                  </button>
                </div>
              </form>

              <div className="mt-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-muted text-sm mb-1">
                  Użytkownicy z dostępem do Twojego planu ({collaborators.length}):
                </p>
                {collaborators.length === 0 ? (
                  <p className="text-muted text-sm">Brak przypisanych obserwatorów.</p>
                ) : (
                  <div className="cal-items">
                    {collaborators.map((u) => (
                      <div key={u.id} className="cal-item flex-between p-1 mt-1">
                        <div>
                          <span className="text-bright" style={{ fontSize: '0.9rem' }}>
                            @{u.username}
                          </span>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleKick(u.username)}
                          title="Usuń dostęp"
                        >
                          Usuń
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
              Dołącz do planu przez identyfikator
            </h3>
            <p className="text-muted text-sm mb-1">
              Po dołączeniu zajęcia z wybranego planu pojawią się na Twoim widoku tygodniowym w trybie do odczytu.
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
                <label htmlFor="join-pass">Hasło dostępowe (jeśli ustawiono)</label>
                <input
                  id="join-pass"
                  type="text"
                  value={joinHaslo}
                  onChange={(e) => setJoinHaslo(e.target.value)}
                  placeholder="Opcjonalnie"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2" disabled={joining}>
                {joining ? 'Dołączanie...' : 'Dołącz do planu'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
