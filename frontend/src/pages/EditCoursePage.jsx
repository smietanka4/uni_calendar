import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

export default function EditCoursePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    client.get(`/zajecia/${id}/`)
      .then(res => {
        // Obetnij sekundy z godziny startu do formatu HH:MM jeśli trzeba
        const data = res.data;
        if (data.godzina_start && data.godzina_start.length > 5) {
          data.godzina_start = data.godzina_start.substring(0, 5);
        }
        setForm(data);
        setFetchLoading(false);
      })
      .catch(() => {
        setError('Nie udało się pobrać danych zajęć.')
        setFetchLoading(false);
      })
  }, [id])

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
      await client.put(`/zajecia/${id}/`, form)
      setSuccess('Zajęcia zostały zaktualizowane!')
      setTimeout(() => navigate(-1), 800) // Wróć tam skąd przyszedł (albo do /wszystkie)
    } catch (err) {
      const data = err.response?.data || {}
      const first = Object.values(data)[0]
      setError(Array.isArray(first) ? first[0] : first || 'Błąd zapisu.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) return <div className="page"><div className="spinner" /></div>
  if (!form) return <div className="page"><div className="alert alert-error">{error}</div></div>

  return (
    <div className="page">
      <h1>[ EDYCJA ZAJĘĆ ] {form.nazwa}</h1>
      <p className="text-muted text-sm mt-1" style={{ marginBottom: '1.5rem' }}>
        // Edytuj dane i zapisz zmiany w systemie
      </p>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="card" noValidate>
        {/* Nazwa + Typ */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="edit-nazwa">Nazwa przedmiotu *</label>
            <input
              id="edit-nazwa"
              type="text"
              value={form.nazwa}
              onChange={set('nazwa')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-typ">Typ zajęć</label>
            <select id="edit-typ" value={form.typ} onChange={set('typ')}>
              {TYPY.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Dzień + Godzina + Czas trwania */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="edit-dzien">Dzień tygodnia</label>
            <select
              id="edit-dzien"
              value={form.dzien_tygodnia}
              onChange={(e) => setForm((p) => ({ ...p, dzien_tygodnia: Number(e.target.value) }))}
            >
              {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edit-godz">Godzina rozpoczęcia</label>
            <input
              id="edit-godz"
              type="time"
              value={form.godzina_start}
              onChange={set('godzina_start')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-czas">Czas trwania (min)</label>
            <input
              id="edit-czas"
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
            <label htmlFor="edit-od">Data pierwszych zajęć *</label>
            <input
              id="edit-od"
              type="date"
              value={form.data_od}
              onChange={set('data_od')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-do">Data ostatnich zajęć *</label>
            <input
              id="edit-do"
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
            <label htmlFor="edit-sala">Sala</label>
            <input
              id="edit-sala"
              type="text"
              value={form.sala || ''}
              onChange={set('sala')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-prow">Prowadzący</label>
            <input
              id="edit-prow"
              type="text"
              value={form.prowadzacy || ''}
              onChange={set('prowadzacy')}
            />
          </div>
        </div>

        {/* Notatki */}
        <div className="form-group">
          <label htmlFor="edit-notatki">Notatki (opcjonalnie)</label>
          <textarea
            id="edit-notatki"
            value={form.notatki || ''}
            onChange={set('notatki')}
          />
        </div>

        <div className="flex gap-1 mt-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Zapisywanie…' : '💾 ZAPISZ ZMIANY'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            ANULUJ
          </button>
        </div>
      </form>
    </div>
  )
}
