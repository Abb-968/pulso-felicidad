import { Search } from 'lucide-react'
import { regionEs } from '../utils/i18n.js'

export default function Header({ year, setYear, region, setRegion, regions, countries, search, setSearch, tab, setTab, clearFilters, onDataNotes, onCountrySelect }) {
  const tabs = ['Panorama', 'Explorar factores', 'Mi país', 'Datos y notas']
  return (
    <header className="topbar">
      <div className="header-main">
        <div className="brand">
          <div className="brand-copy">
            <h1 style={{ whiteSpace: 'nowrap' }}>El pulso de la felicidad mundial</h1>
            <p>World Happiness Report 2015–2024 · 140 países</p>
          </div>
        </div>

        <nav className="tabs" aria-label="Vistas del dashboard">
          {tabs.map((item) => (
            <button key={item} type="button" className={tab === item ? 'active' : ''} onClick={() => item === 'Datos y notas' ? onDataNotes() : setTab(item)}>{item}</button>
          ))}
        </nav>
      </div>

      <div className="header-filters">
        <label className="year-control">
          <span>Año</span>
          <input type="range" min="2015" max="2024" value={year} onChange={(event) => setYear(Number(event.target.value))} />
          <strong>{year}</strong>
          <button type="button" aria-label="Avanzar año" onClick={() => setYear((value) => value === 2024 ? 2015 : value + 1)}>▶</button>
        </label>

        <label className="region-control">
          <span>Región</span>
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="Todas">Todas</option>
            {regions.map((item) => <option key={item} value={item}>{regionEs(item)}</option>)}
          </select>
        </label>

        <label className="search-control">
          <span>País</span>
          <div>
            <Search size={15} />
            <input type="text" list="country-options" value={search} onChange={(event) => {
              const value = event.target.value
              setSearch(value)
              const match = countries.find((country) => country.nameEs.toLowerCase() === value.trim().toLowerCase() || country.name.toLowerCase() === value.trim().toLowerCase())
              if (match) onCountrySelect(match.key)
            }} placeholder="Buscar país…" autoComplete="off" />
            <datalist id="country-options">
              {countries.map((country) => <option key={country.key} value={country.nameEs} />)}
            </datalist>
          </div>
        </label>

        <button className="clear-button" type="button" onClick={clearFilters}>× Limpiar filtros</button>
      </div>
    </header>
  )
}
