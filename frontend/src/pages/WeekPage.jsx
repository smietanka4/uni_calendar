import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import './WeekPage.css'

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

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
  const [monday, setMonday] = useState(() => mondayOf(new Date()))
  const [zajecia, setZajecia] = useState([])
  const [loading, setLoading] = useState(true)

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

  // Group by day
  const byDay = {}
  zajecia.forEach((z) => {
    const d = z.data_wystapienia
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(z)
  })

  const sunday = addDays(monday, 6)

  return (
    <div className="page">
      <div className="week-header flex-between">
        <div>
          <h1>Widok tygodniowy</h1>
          <p className="text-muted text-sm">
            {fmtDate(monday)} – {fmtDate(sunday)} {monday.getFullYear()}
          </p>
        </div>
        <div className="week-nav flex gap-1">
          <button className="btn btn-ghost btn-sm" onClick={prevWeek}>← Poprzedni</button>
          <button className="btn btn-ghost btn-sm" onClick={thisWeek}>Dziś</button>
          <button className="btn btn-ghost btn-sm" onClick={nextWeek}>Następny →</button>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : zajecia.length === 0 ? (
        <div className="empty-state card">
          <span>📭</span>
          <p>Brak zajęć w tym tygodniu.</p>
          <a href="/dodaj" className="btn btn-primary mt-2">Dodaj zajęcia</a>
        </div>
      ) : (
        <div className="week-grid mt-3">
          {Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => {
            const d = new Date(date)
            const dayName = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]
            const isToday = toISO(new Date()) === date
            return (
              <div key={date} className={`day-column card${isToday ? ' today' : ''}`}>
                <div className="day-header">
                  <span className="day-name">{dayName}</span>
                  <span className="day-date">{fmtDate(d)}</span>
                </div>
                <div className="day-events">
                  {items.map((z) => (
                    <div key={z.id} className="event-card">
                      <div className="event-time">{z.godzina_start.slice(0,5)}–{z.godzina_koniec}</div>
                      <div className="event-name">{z.nazwa}</div>
                      <div className="flex-center gap-1 mt-1">
                        <span className={typBadgeClass(z.typ)}>{z.typ_display}</span>
                        {z.sala && <span className="event-meta">📍 {z.sala}</span>}
                      </div>
                      {z.prowadzacy && <div className="event-meta mt-1">👤 {z.prowadzacy}</div>}
                      {z.notatki && <div className="event-notes">{z.notatki}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
