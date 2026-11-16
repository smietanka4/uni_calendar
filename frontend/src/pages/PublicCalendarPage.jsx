import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import client from '../api/client'
import './WeekPage.css'

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7:00 to 21:00

const START_HOUR = 7
const MIN_PX = 1.3
const CAL_HEIGHT = 15 * 60 * MIN_PX

function toISO(d) {
  return d.toISOString().split('T')[0]
}

function mondayOf(d) {
  const day = new Date(d)
  const diff = day.getDay() === 0 ? -6 : 1 - day.getDay()
  day.setDate(day.getDate() + diff)
  return day
}

function addDays(d, n) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function fmtDate(d) {
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
}

function typBadgeClass(typ) {
  const map = { WYK: 'wyk', LAB: 'lab', CWI: 'cwi', SEM: 'sem', PRO: 'pro', INN: 'inn' }
  return `badge badge-${map[typ] || 'inn'}`
}

export default function PublicCalendarPage() {
  const { calendarId } = useParams()
  const [monday, setMonday] = useState(() => mondayOf(new Date()))
  const [zajecia, setZajecia] = useState([])
  const [calendar, setCalendar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [forking, setForking] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const [selectedEvent, setSelectedEvent] = useState(null)

  const fetchWeek = useCallback(async (mon) => {
    setLoading(true)
    setError('')
    try {
      const calRes = await axios.get(`/api/public/calendars/${calendarId}`)
      setCalendar(calRes.data)

      const weekRes = await axios.get(`/api/public/calendars/${calendarId}/week?data=${toISO(mon)}`)
      setZajecia(weekRes.data)
    } catch {
      setError('Nie udało się załadować publicznego kalendarza. Może nie istnieć lub nie być udostępniony.')
      setZajecia([])
    } finally {
      setLoading(false)
    }
  }, [calendarId])

  useEffect(() => {
    fetchWeek(monday)
  }, [monday, fetchWeek])

  const prevWeek = () => setMonday((m) => addDays(m, -7))
  const nextWeek = () => setMonday((m) => addDays(m, 7))
  const thisWeek = () => setMonday(mondayOf(new Date()))

  const sunday = addDays(monday, 6)
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  const handleFork = async () => {
    if (!window.confirm(`Czy na pewno chcesz sklonować harmonogram "${calendar.nazwa}"?`)) return
    setForking(true)
    setError('')
    try {
      await client.post(`/calendars/${calendarId}/fork`)
      setSuccessMsg('Harmonogram został sklonowany! Sprawdź swoje plany.')
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Musisz być zalogowany, aby sklonować harmonogram.')
      } else {
        setError(err.response?.data?.error || 'Błąd podczas klonowania.')
      }
    } finally {
      setForking(false)
    }
  }

  if (error) {
    return (
      <div className="page page-wide">
        <div className="alert alert-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="page page-wide">
      {successMsg && <div className="alert alert-success mb-2">{successMsg}</div>}

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedEvent.nazwa}
                <span className="badge badge-lab ml-1">Publiczny</span>
              </h2>
              <button className="btn-close" onClick={() => setSelectedEvent(null)} aria-label="Zamknij">
                X
              </button>
            </div>
            <div className="modal-body">
              <p>
                Typ zajęć: <span className={typBadgeClass(selectedEvent.typ)}>{selectedEvent.typ_display}</span>
              </p>
              <p>
                Kalendarz:{' '}
                <span className="text-bright" style={{ background: 'var(--surface-2)', padding: '2px 6px' }}>
                  {selectedEvent.kalendarz_nazwa}
                </span>
              </p>
              <p>
                Godziny:{' '}
                <span className="text-bright">
                  {selectedEvent.godzina_start.slice(0, 5)} - {selectedEvent.godzina_koniec}
                </span>{' '}
                <span className="text-muted">({selectedEvent.czas_trwania_min} min)</span>
              </p>
              <p>
                Sala: <span className="text-bright">{selectedEvent.sala || 'Brak'}</span>
              </p>
              <p>
                Prowadzący: <span className="text-bright">{selectedEvent.prowadzacy || 'Brak'}</span>
              </p>
              <p>
                Okres: <span className="text-bright">{selectedEvent.data_od}</span> do{' '}
                <span className="text-bright">{selectedEvent.data_do}</span>
              </p>

              {selectedEvent.notatki && (
                <div className="modal-notes mt-2">
                  <div className="text-muted text-sm mb-1">Notatki:</div>
                  {selectedEvent.notatki}
                </div>
              )}
            </div>
            <div className="modal-footer mt-3">
              <p className="text-muted text-sm text-center">Widok publiczny (tylko do odczytu).</p>
            </div>
          </div>
        </div>
      )}

      <div className="week-header flex-between mb-2">
        <div>
          <h1>Widok publiczny {calendar ? `: ${calendar.nazwa}` : ''}</h1>
          <p className="text-muted text-sm mt-1">
            {fmtDate(monday)} - {fmtDate(sunday)} {monday.getFullYear()}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleFork}
            disabled={forking || !calendar}
          >
            {forking ? 'Klonowanie...' : 'Sklonuj ten harmonogram'}
          </button>

          <div className="week-nav flex gap-1">
            <button className="btn btn-ghost btn-sm" onClick={prevWeek}>
              Poprzedni
            </button>
            <button className="btn btn-ghost btn-sm" onClick={thisWeek}>
              Bieżący tydzień
            </button>
            <button className="btn btn-ghost btn-sm" onClick={nextWeek}>
              Następny
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="week-layout">
          <div className="cal-wrapper card" style={{ flexGrow: 1 }}>
            <div className="cal-grid">
              <div className="cal-header-corner" />

              {daysOfWeek.map((d, i) => {
                const dateStr = toISO(d)
                const isToday = dateStr === toISO(new Date())
                return (
                  <div key={dateStr} className={`cal-header-day ${isToday ? 'today' : ''}`}>
                    <div className="cal-day-name">{DAYS[i]}</div>
                    <div className="cal-day-date">{fmtDate(d)}</div>
                  </div>
                )
              })}

              <div className="cal-body" style={{ height: `${CAL_HEIGHT}px` }}>
                <div className="cal-bg-lines">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="cal-bg-line"
                      style={{ top: `${(h - START_HOUR) * 60 * MIN_PX}px` }}
                    />
                  ))}
                </div>

                <div className="cal-time-col">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="cal-time-label"
                      style={{ top: `${(h - START_HOUR) * 60 * MIN_PX}px` }}
                    >
                      {h.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {daysOfWeek.map((d) => {
                  const dateStr = toISO(d)
                  const isToday = dateStr === toISO(new Date())
                  const dayEvents = zajecia.filter((z) => z.data_wystapienia === dateStr)

                  return (
                    <div key={dateStr} className={`cal-day-col ${isToday ? 'today' : ''}`}>
                      {dayEvents.map((z) => {
                        let top = 0
                        let height = 90
                        if (z.godzina_start) {
                          const [h, m] = z.godzina_start.split(':').map(Number)
                          const startMins = h * 60 + (m || 0) - START_HOUR * 60
                          top = startMins * MIN_PX
                          height = (z.czas_trwania_min || 90) * MIN_PX
                        }

                        return (
                          <div
                            key={z.id}
                            className="cal-event"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: calendar ? calendar.kolor : undefined,
                            }}
                            onClick={() => setSelectedEvent(z)}
                            title={`${z.nazwa} (${z.godzina_start.slice(0, 5)} - ${z.godzina_koniec})`}
                          >
                            <div className="cal-event-time">
                              {z.godzina_start.slice(0, 5)} - {z.godzina_koniec}
                            </div>
                            <div className="cal-event-title">{z.nazwa}</div>

                            {height > 50 && (
                              <div className="cal-event-meta mt-1">
                                <span className={typBadgeClass(z.typ)}>{z.typ_display}</span>
                                {z.sala && <span>Sala {z.sala}</span>}
                              </div>
                            )}

                            {height >= 70 && z.prowadzacy && (
                              <div className="cal-event-prow mt-1">{z.prowadzacy}</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
