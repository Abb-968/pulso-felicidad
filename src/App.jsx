import { useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import Panorama from './components/Panorama.jsx'
import Factors from './components/Factors.jsx'
import CountryView from './components/CountryView.jsx'
import DataNotes from './components/DataNotes.jsx'
import happiness from './data/happiness.json'
import { regionEs } from './utils/i18n.js'
import { countryEs } from './utils/countryCatalog.js'
import './dashboard.css'

export default function App() {
  const [year, setYear] = useState(2024)
  const [region, setRegion] = useState('Todas')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('Panorama')
  const [countryKey, setCountryKey] = useState('mexico')

  const regions = useMemo(() => [...new Set(happiness.map((row) => row.region))].sort((a, b) => regionEs(a).localeCompare(regionEs(b), 'es')), [])
  const filtered = useMemo(() => happiness.filter((row) => row.year === year && (region === 'Todas' || row.region === region) && (row.country.toLowerCase().includes(search.toLowerCase()) || countryEs(row.country).toLowerCase().includes(search.toLowerCase()))), [year, region, search])
  const countries = useMemo(() => [...new Map(happiness.map((row) => [row.country_key, row.country])).entries()].map(([key, name]) => ({ key, name, nameEs: countryEs(name) })).sort((a, b) => a.nameEs.localeCompare(b.nameEs, 'es')), [])

  const clearFilters = () => {
    setYear(2024)
    setRegion('Todas')
    setSearch('')
  }

  const selectCountry = (key) => {
    setCountryKey(key)
    setTab('Mi país')
  }

  return (
    <div className="app-shell">
      <Header year={year} setYear={setYear} region={region} setRegion={setRegion} regions={regions} countries={countries} search={search} setSearch={setSearch} tab={tab} setTab={setTab} clearFilters={clearFilters} onCountrySelect={selectCountry} onDataNotes={() => setTab('Datos y notas')} />
      <main>
        {filtered.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">◎</span><h2>No hay países con esos filtros</h2><p>Prueba otra región, año o nombre de país.</p><button type="button" onClick={clearFilters}>Limpiar filtros</button></div>
        ) : tab === 'Panorama' ? <Panorama data={happiness} year={year} region={region} onSelectCountry={selectCountry} />
          : tab === 'Explorar factores' ? <Factors data={happiness} year={year} region={region} />
            : tab === 'Mi país' ? <CountryView data={happiness} year={year} countryKey={countryKey} setCountryKey={setCountryKey} search={search} />
              : <DataNotes data={happiness} year={year} region={region} search={search} />}
      </main>
    </div>
  )
}
