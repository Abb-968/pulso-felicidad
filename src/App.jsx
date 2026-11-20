import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import Panorama from './components/Panorama.jsx'
import Factors from './components/Factors.jsx'
import CountryView from './components/CountryView.jsx'
import DataNotes from './components/DataNotes.jsx'
import { regionEs } from './utils/i18n.js'
import { countryEs } from './utils/countryCatalog.js'
import './dashboard.css'

export default function App() {
  const [year, setYear] = useState(2024)
  const [region, setRegion] = useState('Todas')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('Panorama')
  const [countryKey, setCountryKey] = useState('mexico')
  const [happiness, setHappiness] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isDataNotesOpen, setIsDataNotesOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const module = await import('./data/happiness.json')
      setHappiness(module.default ?? [])
      setLoadError(false)
    } catch {
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const regions = useMemo(() => [...new Set(happiness.map((row) => row.region))].sort((a, b) => regionEs(a).localeCompare(regionEs(b), 'es')), [happiness])
  const yearCountryCount = useMemo(() => new Set(happiness.filter((row) => row.year === year).map((row) => row.country_key)).size, [happiness, year])
  const filtered = useMemo(() => happiness.filter((row) => row.year === year && (region === 'Todas' || row.region === region) && (row.country.toLowerCase().includes(search.toLowerCase()) || countryEs(row.country).toLowerCase().includes(search.toLowerCase()))), [happiness, year, region, search])
  const countries = useMemo(() => [...new Map(happiness.map((row) => [row.country_key, row.country])).entries()].map(([key, name]) => ({ key, name, nameEs: countryEs(name) })).sort((a, b) => a.nameEs.localeCompare(b.nameEs, 'es')), [happiness])

  const clearFilters = () => {
    setYear(2024)
    setRegion('Todas')
    setSearch('')
    if (tab === 'Mi país') {
      setCountryKey('mexico')
    }
  }

  const recoverCountryView = () => {
    setYear(2024)
    setRegion('Todas')
    setSearch('')
    setCountryKey('mexico')
  }

  const openDataNotes = () => {
    setIsDataNotesOpen(true)
  }

  const closeDataNotes = useCallback(() => {
    setIsDataNotesOpen(false)
  }, [])

  useEffect(() => {
    if (!isDataNotesOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeDataNotes()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isDataNotesOpen, closeDataNotes])

  const selectCountry = (key) => {
    setCountryKey(key)
    setTab('Mi país')
  }

  return (
    <div className="app-shell">
      <Header year={year} setYear={setYear} region={region} setRegion={setRegion} regions={regions} countries={countries} yearCountryCount={yearCountryCount} search={search} setSearch={setSearch} tab={tab} setTab={setTab} clearFilters={clearFilters} onCountrySelect={selectCountry} onDataNotes={openDataNotes} />
      <main>
        {isLoading ? (
          <div className="loading-grid" aria-live="polite" aria-busy="true">
            <div className="loading-block" />
            <div className="loading-block" />
            <div className="loading-block" />
            <div className="loading-block" />
          </div>
        ) : loadError ? (
          <div className="empty-state"><span className="empty-icon">◎</span><h2>No se pudieron cargar los datos</h2><p>Revisa la conexión o vuelve a intentarlo.</p><button type="button" onClick={() => { setIsLoading(true); setLoadError(false); loadData() }}>Reintentar</button></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">◎</span><h2>No hay países con estos filtros</h2><p>Prueba otra región, año o nombre de país.</p><button type="button" onClick={clearFilters}>Limpiar filtros</button></div>
        ) : tab === 'Panorama' ? <Panorama data={happiness} year={year} region={region} onSelectCountry={selectCountry} countryKey={countryKey} onOpenDataNotes={openDataNotes} />
          : tab === 'Explorar factores' ? <Factors data={happiness} year={year} region={region} countryKey={countryKey} onOpenDataNotes={openDataNotes} />
            : tab === 'Mi país' ? <CountryView data={happiness} year={year} countryKey={countryKey} setCountryKey={setCountryKey} search={search} onRecover={recoverCountryView} />
              : <CountryView data={happiness} year={year} countryKey={countryKey} setCountryKey={setCountryKey} search={search} onRecover={recoverCountryView} />}
      </main>

      {isDataNotesOpen && !isLoading && !loadError && (
        <div className="drawer-backdrop" onClick={closeDataNotes}>
          <aside className="data-drawer-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Datos y notas">
            <DataNotes data={happiness} year={year} region={region} search={search} onClose={closeDataNotes} />
          </aside>
        </div>
      )}
    </div>
  )
}
