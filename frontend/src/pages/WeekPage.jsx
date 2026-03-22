import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import './WeekPage.css'

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7:00 to 21:00

// Config for grid rendering
const START_HOUR = 7;
const MIN_PX = 1.3; // 1 min = 1.3px
const CAL_HEIGHT = 15 * 60 * MIN_PX; // 15 hours total height

function toISO(d) { return d.toISOString().split('T')[0] }

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
  const [loading, setLoading] = useState(true)

  // Opcje modala
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fetchWeek = useCallback(async (mon) => {
    setLoading(true)
    try {
      const { data } = await client.get(`/zajecia/tydzien/?data=${toISO(mon)}`)
      setZajecia(data)
    } catch {
      setZajecia([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWeek(monday) }, [monday, fetchWeek])

  const prevWeek = () => setMonday((m) => addDays(m, -7))
  const nextWeek = () => setMonday((m) => addDays(m, 7))
  const thisWeek = () => setMonday(mondayOf(new Date()))

  const handleDelete = async (id) => {
    setDeleting(true)
    setDeleteError('')
    try {
      await client.delete(`/zajecia/${id}/`)
      setZajecia(prev => prev.filter(z => z.id !== id))
      setSelectedEvent(null)
    } catch (err) {
      setDeleteError('Wystąpił błąd podczas usuwania. Odśwież stronę i spróbuj ponownie.')
    } finally {
      setDeleting(false)
    }
  }

  const sunday = addDays(monday, 6)
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  return (
    <div className="page" style={{ maxWidth: '1400px' }}>
      {/* Modal / Popup Informacyjny */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                [ {selectedEvent.nazwa} ]
                {!selectedEvent.czy_wlasciciel && <span className="ml-1" title="Zajęcia tylko do odczytu">🔒</span>}
              </h2>
              <button className="btn-close" onClick={() => setSelectedEvent(null)}>X</button>
            </div>
            <div className="modal-body">
              {deleteError && <div className="alert alert-error mb-2">{deleteError}</div>}
              <p>&gt; TYP: <span className={typBadgeClass(selectedEvent.typ)}>{selectedEvent.typ_display}</span></p>
              <p>&gt; GRUPA: <span className="text-bright bg-muted px-1" style={{background: 'rgba(0,0,0,0.5)', padding: '2px 4px'}}>{selectedEvent.kalendarz_nazwa}</span></p>
              <p>&gt; CZAS: <span className="text-bright">{selectedEvent.godzina_start.slice(0,5)}–{selectedEvent.godzina_koniec}</span> <span className="text-muted">({selectedEvent.czas_trwania_min} min)</span></p>
              <p>&gt; SALA: <span className="text-bright">{selectedEvent.sala || '—'}</span></p>
              <p>&gt; PROW.: <span className="text-bright">{selectedEvent.prowadzacy || '—'}</span></p>
              <p>&gt; OKRES: <span className="text-bright">{selectedEvent.data_od}</span> do <span className="text-bright">{selectedEvent.data_do}</span></p>
              
              {selectedEvent.notatki && (
                <div className="modal-notes mt-2">
                  <div className="text-muted text-sm mb-1">// NOTATKI</div>
                  {selectedEvent.notatki}
                </div>
              )}
            </div>
            {selectedEvent.czy_wlasciciel && (
              <div className="modal-footer mt-3 flex gap-1">
                <button 
                  className="btn btn-ghost w-full"
                  onClick={() => navigate(`/edytuj/${selectedEvent.id}`)}
                >
                  ✏️ EDYTUJ
                </button>
                <button 
                  className="btn btn-danger w-full" 
                  onClick={() => handleDelete(selectedEvent.id)}
                  disabled={deleting}
                >
                  {deleting ? 'USUWANIE...' : '🗑️ USUŃ'}
                </button>
              </div>
            )}
            {!selectedEvent.czy_wlasciciel && (
               <div className="modal-footer mt-3">
                 <p className="text-muted text-sm text-center">Tylko administrator grupy może edytować te zajęcia.</p>
               </div>
            )}
          </div>
        </div>
      )}

      <div className="week-header flex-between mb-2">
        <div>
          <h1>WIDOK TYGODNIOWY</h1>
          <p className="text-muted text-sm mt-1">
            {fmtDate(monday)} – {fmtDate(sunday)} {monday.getFullYear()}
          </p>
        </div>
        <div className="week-nav flex gap-1">
          <button className="btn btn-ghost btn-sm" onClick={prevWeek}>&lt; POPRZEDNI</button>
          <button className="btn btn-ghost btn-sm" onClick={thisWeek}>DZIŚ</button>
          <button className="btn btn-ghost btn-sm" onClick={nextWeek}>NASTĘPNY &gt;</button>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="cal-wrapper card">
          <div className="cal-grid">
            {/* Top-Left Corner */}
            <div className="cal-header-corner"></div>

            {/* Day Headers */}
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

            {/* Main Body with Times and Day Columns */}
            <div className="cal-body" style={{ height: `${CAL_HEIGHT}px` }}>
              {/* Horizontal background lines for each hour */}
              <div className="cal-bg-lines">
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="cal-bg-line"
                    style={{ top: `${(h - START_HOUR) * 60 * MIN_PX}px` }}
                  />
                ))}
              </div>

              {/* Left Time Column */}
              <div className="cal-time-col">
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="cal-time-label"
                    style={{ top: `${(h - START_HOUR) * 60 * MIN_PX}px` }}
                  >
                    {h.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day Columns containing absolute positioned events */}
              {daysOfWeek.map((d) => {
                const dateStr = toISO(d)
                const isToday = dateStr === toISO(new Date())
                const dayEvents = zajecia.filter(z => z.data_wystapienia === dateStr)

                return (
                  <div key={dateStr} className={`cal-day-col ${isToday ? 'today' : ''}`}>
                    {dayEvents.map(z => {
                      let top = 0, height = 90
                      if (z.godzina_start) {
                        const [h, m] = z.godzina_start.split(':').map(Number)
                        const startMins = (h * 60 + (m || 0)) - (START_HOUR * 60)
                        top = startMins * MIN_PX
                        height = (z.czas_trwania_min || 90) * MIN_PX
                      }

                      return (
                        <div
                          key={z.id}
                          className="cal-event"
                          style={{ top: `${top}px`, height: `${height}px` }}
                          onClick={() => setSelectedEvent(z)}
                          title={`${z.nazwa} (${z.godzina_start.slice(0,5)}–${z.godzina_koniec})\nKliknij, aby rozwinąć szczegóły.`}
                        >
                          <div className="cal-event-time">
                            {z.godzina_start.slice(0,5)}–{z.godzina_koniec}
                          </div>
                          <div className="cal-event-title">{z.nazwa}</div>
                          
                          {height > 50 && (
                            <div className="cal-event-meta mt-1">
                              <span className={typBadgeClass(z.typ)}>{z.typ_display}</span>
                              {z.sala && <span style={{marginLeft:'0.4rem'}}>📍{z.sala}</span>}
                            </div>
                          )}
                          
                          {/* Dodany Prowadzący */}
                          {height >= 70 && z.prowadzacy && (
                            <div className="cal-event-prow mt-1">
                              👤 {z.prowadzacy}
                            </div>
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
      )}
    </div>
  )
}
