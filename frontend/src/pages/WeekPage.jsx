import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import useStomp from '../hooks/useStomp'
import Noticeboard from './Noticeboard'
import './WeekPage.css'

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
const HOURS = Array.from({ length: 24 }, (_, i) => i) // 0:00 to 23:00

const START_HOUR = 0
const MIN_PX = 1.3
const CAL_HEIGHT = 24 * 60 * MIN_PX

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

export default function WeekPage() {
  const navigate = useNavigate()
  const [monday, setMonday] = useState(() => mondayOf(new Date()))
  const [zajecia, setZajecia] = useState([])
  const [layers, setLayers] = useState([])
  const [primaryCalendar, setPrimaryCalendar] = useState(null)
  const [loading, setLoading] = useState(true)

  const { messages: stompMessages } = useStomp(primaryCalendar?.id)

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fetchWeek = useCallback(async (mon) => {
    setLoading(true)
    try {
      const { data } = await client.get(`/courses/week?data=${toISO(mon)}`)
      setZajecia(data)

      const calRes = await client.get('/calendars')
      const myPlan = calRes.data.find((k) => k.czy_wlasciciel)
      if (myPlan) setPrimaryCalendar(myPlan)

      const layersRes = await client.get('/layer-preferences')
      setLayers(layersRes.data)
    } catch {
      setZajecia([])
      setLayers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeek(monday)
  }, [monday, fetchWeek])

  useEffect(() => {
    if (stompMessages && stompMessages.length > 0) {
      const latestMsg = stompMessages[stompMessages.length - 1]
      if (latestMsg.type === 'COURSE_CREATED' || latestMsg.type === 'COURSE_UPDATED') {
        fetchWeek(monday)
      } else if (latestMsg.type === 'COURSE_DELETED') {
        setZajecia((prev) => prev.filter((z) => z.id !== latestMsg.payload.id))
      }
    }
  }, [stompMessages, monday, fetchWeek])

  const prevWeek = () => setMonday((m) => addDays(m, -7))
  const nextWeek = () => setMonday((m) => addDays(m, 7))
  const thisWeek = () => setMonday(mondayOf(new Date()))

  const handleDelete = async (id) => {
    setDeleting(true)
    setDeleteError('')
    try {
      await client.delete(`/courses/${id}`)
      setZajecia((prev) => prev.filter((z) => z.id !== id))
      setSelectedEvent(null)
    } catch {
      setDeleteError('Wystąpił błąd podczas usuwania zajęć. Odśwież stronę i spróbuj ponownie.')
    } finally {
      setDeleting(false)
    }
  }

  const toggleLayer = async (layerId, currentVisible) => {
    try {
      setLayers((prev) =>
        prev.map((l) => (l.calendar_id === layerId ? { ...l, widoczna: !currentVisible } : l))
      )
      await client.put(`/layer-preferences/${layerId}`, { widoczna: !currentVisible })
    } catch {
      fetchWeek(monday)
    }
  }

  const sunday = addDays(monday, 6)
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  return (
    <div className="page page-wide">
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedEvent.nazwa}
                {selectedEvent.source_course_id && (
                  <span className="badge badge-sem ml-1" title="Zajęcia pochodzą z szablonu">
                    Szablon
                  </span>
                )}
                {!selectedEvent.czy_wlasciciel && (
                  <span className="badge badge-inn ml-1" title="Zajęcia tylko do odczytu">
                    Tylko odczyt
                  </span>
                )}
              </h2>
              <button className="btn-close" onClick={() => setSelectedEvent(null)} aria-label="Zamknij">
                X
              </button>
            </div>
            <div className="modal-body">
              {deleteError && <div className="alert alert-error mb-2">{deleteError}</div>}
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
            {selectedEvent.czy_wlasciciel ? (
              <div className="modal-footer mt-3 flex gap-1">
                <button
                  className="btn btn-ghost w-full"
                  onClick={() => navigate(`/edytuj/${selectedEvent.id}`)}
                >
                  Edytuj
                </button>
                <button
                  className="btn btn-danger w-full"
                  onClick={() => handleDelete(selectedEvent.id)}
                  disabled={deleting}
                >
                  {deleting ? 'Usuwanie...' : 'Usuń'}
                </button>
              </div>
            ) : (
              <div className="modal-footer mt-3">
                <p className="text-muted text-sm text-center">
                  Tylko właściciel lub współtwórca planu może edytować te zajęcia.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="week-header flex-between mb-2">
        <div>
          <h1>Rozkład tygodniowy</h1>
          <p className="text-muted text-sm mt-1">
            {fmtDate(monday)} - {fmtDate(sunday)} {monday.getFullYear()}
          </p>
        </div>
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

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="week-layout">
          {/* Lewa kolumna: Warstwy */}
          <div className="layers-panel card">
            <h3 className="mb-2 text-sm text-muted">Warstwy kalendarzy</h3>
            <div className="flex flex-col gap-1">
              {layers.map((layer) => (
                <label
                  key={layer.calendar_id}
                  className="flex items-center gap-1"
                  style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={layer.widoczna}
                    onChange={() => toggleLayer(layer.calendar_id, layer.widoczna)}
                    style={{ accentColor: layer.kolor }}
                  />
                  <span
                    style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      backgroundColor: layer.kolor,
                      borderRadius: '2px',
                    }}
                  />
                  <span className="truncate" title={layer.calendar_name}>
                    {layer.calendar_name}
                  </span>
                </label>
              ))}
              {layers.length === 0 && <span className="text-muted text-sm">Brak przypisanych warstw.</span>}
            </div>
          </div>

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
                      style={{ top: `${((h - START_HOUR) * 60 + 30) * MIN_PX}px` }}
                    >
                      {h.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {daysOfWeek.map((d) => {
                  const dateStr = toISO(d)
                  const isToday = dateStr === toISO(new Date())
                  const dayEvents = zajecia.filter((z) => {
                    if (z.data_wystapienia !== dateStr) return false
                    const layer = layers.find((l) => l.calendar_id === z.kalendarz)
                    return layer ? layer.widoczna : true
                  })

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

                        const layer = layers.find((l) => l.calendar_id === z.kalendarz)
                        const bgColor = layer?.kolor

                        return (
                          <div
                            key={z.id}
                            className="cal-event"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: bgColor || undefined,
                            }}
                            onClick={() => setSelectedEvent(z)}
                            title={`${z.nazwa} (${z.godzina_start.slice(0, 5)} - ${z.godzina_koniec})`}
                          >
                            <div className="cal-event-time">
                              {z.godzina_start.slice(0, 5)} - {z.godzina_koniec}
                            </div>
                            <div className="cal-event-title">
                              {z.source_course_id && (
                                <span className="badge badge-sem" style={{ marginRight: '4px', fontSize: '0.65rem' }}>
                                  SZABLON
                                </span>
                              )}
                              {z.nazwa}
                            </div>

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

          {primaryCalendar && (
            <div className="noticeboard-wrapper">
              <Noticeboard
                calendarId={primaryCalendar.id}
                canEdit={true}
                newStompMessages={stompMessages}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
