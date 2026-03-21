import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import './AllCoursesPage.css'

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

function typBadgeClass(typ) {
  const map = { WYK: 'wyk', LAB: 'lab', CWI: 'cwi', SEM: 'sem', PRO: 'pro', INN: 'inn' }
  return `badge badge-${map[typ] || 'inn'}`
}

export default function AllCoursesPage() {
  const navigate = useNavigate()
  const [zajecia, setZajecia] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirm, setConfirm] = useState(null) // id to confirm delete

  const fetchAll = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : ''
      const { data } = await client.get(`/zajecia/${params}`)
      setZajecia(data)
    } catch {
      setZajecia([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchAll(query)
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await client.delete(`/zajecia/${id}/`)
      setZajecia((prev) => prev.filter((z) => z.id !== id))
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null)
      setConfirm(null)
    }
  }

  return (
    <div className="page">
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Wszystkie zajęcia</h1>
          <p className="text-muted text-sm">
            {zajecia.length} {zajecia.length === 1 ? 'wpis' : zajecia.length < 5 ? 'wpisy' : 'wpisów'}
          </p>
        </div>
        <a href="/dodaj" className="btn btn-primary">+ Dodaj zajęcia</a>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="search-form mt-2">
        <input
          type="text"
          placeholder="Szukaj po nazwie, prowadzącym, sali…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          id="search-input"
        />
        <button type="submit" className="btn btn-ghost">Szukaj</button>
        {query && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setQuery(''); fetchAll() }}
          >
            ✕
          </button>
        )}
      </form>

      {loading ? (
        <div className="spinner" />
      ) : zajecia.length === 0 ? (
        <div className="empty-state card mt-3">
          <span>📭</span>
          <p>{query ? `Brak wyników dla "${query}"` : 'Brak zajęć. Dodaj pierwsze!'}</p>
        </div>
      ) : (
        <div className="courses-table card mt-3">
          <table>
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Typ</th>
                <th>Dzień</th>
                <th>Godzina</th>
                <th>Sala</th>
                <th>Prowadzący</th>
                <th>Okres</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {zajecia.map((z) => (
                <tr key={z.id}>
                  <td>
                    <div className="course-name">{z.nazwa}</div>
                    {z.notatki && <div className="text-muted text-sm">{z.notatki}</div>}
                  </td>
                  <td><span className={typBadgeClass(z.typ)}>{z.typ_display}</span></td>
                  <td>{DAYS[z.dzien_tygodnia]}</td>
                  <td className="nowrap">{z.godzina_start.slice(0,5)}–{z.godzina_koniec}</td>
                  <td>{z.sala || '—'}</td>
                  <td>{z.prowadzacy || '—'}</td>
                  <td className="nowrap text-sm">
                    {z.data_od}<br /><span className="text-muted">do {z.data_do}</span>
                  </td>
                  <td>
                    {confirm === z.id ? (
                      <div className="flex gap-1">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(z.id)}
                          disabled={deletingId === z.id}
                        >
                          {deletingId === z.id ? '…' : 'USUŃ'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirm(null)}
                        >
                          ANULUJ
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/edytuj/${z.id}`)}
                          title="Edytuj zajęcia"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirm(z.id)}
                          title="Usuń zajęcia"
                        >
                          🗑
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
