import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

const TYPY = [
  { value: 'WYK', label: 'Wykład' },
  { value: 'LAB', label: 'Laboratorium' },
  { value: 'CWI', label: 'Ćwiczenia' },
  { value: 'SEM', label: 'Seminarium' },
  { value: 'PRO', label: 'Projekt' },
  { value: 'INN', label: 'Inne' },
]

const DAYS = [
  { value: 0, label: 'Poniedziałek' },
  { value: 1, label: 'Wtorek' },
  { value: 2, label: 'Środa' },
  { value: 3, label: 'Czwartek' },
  { value: 4, label: 'Piątek' },
  { value: 5, label: 'Sobota' },
  { value: 6, label: 'Niedziela' },
]

const EMPTY = {
  nazwa: '',
  typ: 'WYK',
  dzien_tygodnia: 0,
  godzina_start: '08:00',
  czas_trwania_min: 90,
  data_od: '',
  data_do: '',
  sala: '',
  prowadzacy: '',
  notatki: '',
}

export default function AddCoursePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.nazwa.trim()) { setError('Podaj nazwę przedmiotu.'); return }
    if (!form.data_od || !form.data_do) { setError('Podaj daty początku i końca zajęć.'); return }
    if (form.data_do < form.data_od) { setError('Data końca musi być późniejsza niż data początku.'); return }

    setLoading(true)
    try {
      await client.post('/zajecia/', form)
      setSuccess('Zajęcia zostały dodane!')
      setForm(EMPTY)
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      const data = err.response?.data || {}
      const firstKey = Object.keys(data)[0]
      const firstVal = data[firstKey]
      const msg = Array.isArray(firstVal) ? firstVal[0] : firstVal || 'Błąd zapisu.'
      setError(`[${firstKey}] ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1>Dodaj nowe zajęcia</h1>
      <p className="text-muted text-sm mt-1" style={{ marginBottom: '1.5rem' }}>
        Zajęcia będą się powtarzać co tydzień w wybranym dniu przez cały podany okres.
      </p>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="card" noValidate>
        <div className="form-group mb-1">
          {/* Kalendarz Selector removed */}
        </div>

        {/* Nazwa + Typ */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="add-nazwa">Nazwa przedmiotu *</label>
            <input
              id="add-nazwa"
              type="text"
              placeholder="np. Programowanie w języku Golang"
              value={form.nazwa}
              onChange={set('nazwa')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="add-typ">Typ zajęć</label>
            <select id="add-typ" value={form.typ} onChange={set('typ')}>
              {TYPY.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Dzień + Godzina + Czas trwania */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="add-dzien">Dzień tygodnia</label>
            <select
              id="add-dzien"
              value={form.dzien_tygodnia}
              onChange={(e) => setForm((p) => ({ ...p, dzien_tygodnia: Number(e.target.value) }))}
            >
              {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="add-godz">Godzina rozpoczęcia</label>
            <input
              id="add-godz"
              type="time"
              value={form.godzina_start}
              onChange={set('godzina_start')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="add-czas">Czas trwania (min)</label>
            <input
              id="add-czas"
              type="number"
              min="15"
              max="480"
              step="15"
              value={form.czas_trwania_min}
              onChange={set('czas_trwania_min')}
            />
          </div>
        </div>

        {/* Daty */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="add-od">Data pierwszych zajęć *</label>
            <input
              id="add-od"
              type="date"
              value={form.data_od}
              onChange={set('data_od')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="add-do">Data ostatnich zajęć *</label>
            <input
              id="add-do"
              type="date"
              value={form.data_do}
              min={form.data_od}
              onChange={set('data_do')}
              required
            />
          </div>
        </div>

        {/* Sala + Prowadzący */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="add-sala">Sala</label>
            <input
              id="add-sala"
              type="text"
              placeholder="np. 3.13, A202"
              value={form.sala}
              onChange={set('sala')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="add-prow">Prowadzący</label>
            <input
              id="add-prow"
              type="text"
              placeholder="np. dr inż. Jan Tuziemski"
              value={form.prowadzacy}
              onChange={set('prowadzacy')}
            />
          </div>
        </div>

        {/* Notatki */}
        <div className="form-group">
          <label htmlFor="add-notatki">Notatki (opcjonalnie)</label>
          <textarea
            id="add-notatki"
            placeholder="Dodatkowe informacje, uwagi…"
            value={form.notatki}
            onChange={set('notatki')}
          />
        </div>

        <div className="flex gap-1 mt-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Zapisywanie…' : '💾 Zapisz zajęcia'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
            Anuluj
          </button>
        </div>
      </form>
    </div>
  )
}
