import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Search } from 'lucide-react'
import { regionEs } from '../utils/i18n.js'

export default function Header({ year, setYear, region, setRegion, regions, countries, yearCountryCount, search, setSearch, tab, setTab, clearFilters, onDataNotes, onCountrySelect }) {
  const tabs = ['Panorama', 'Explorar factores', 'Mi país']
  const [isPlaying, setIsPlaying] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(media.matches)
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches)
      if (event.matches) setIsPlaying(false)
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isPlaying || prefersReducedMotion) return undefined
    timerRef.current = setInterval(() => {
      setYear((value) => (value === 2024 ? 2015 : value + 1))
    }, 1200)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isPlaying, prefersReducedMotion, setYear])

  useEffect(() => () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const togglePlay = () => {
    if (prefersReducedMotion) {
      setYear((value) => (value === 2024 ? 2015 : value + 1))
      return
    }
    setIsPlaying((value) => !value)
  }

  return (
    <header className="topbar">
      <div className="header-main">
        <div className="brand">
          <div className="brand-copy">
            <h1>El pulso de la felicidad mundial</h1>
            <p>World Happiness Report 2015-2024 · {yearCountryCount} países en el año seleccionado</p>
          </div>
          <svg className="pulse-mark" viewBox="0 0 120 30" aria-hidden="true">
            <path d="M2 16 H28 L36 8 L44 22 L52 11 L60 16 H118" fill="none" stroke="#D97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="header-top-controls">
          <label className="year-control">
            <span>Año</span>
            <input type="range" min="2015" max="2024" value={year} onChange={(event) => setYear(Number(event.target.value))} aria-label="Seleccionar año" />
            <strong>{year}</strong>
            <button type="button" aria-label={prefersReducedMotion ? 'Avanzar año' : (isPlaying ? 'Pausar reproducción' : 'Reproducir años')} onClick={togglePlay}>{isPlaying && !prefersReducedMotion ? <Pause size={14} /> : <Play size={14} />}</button>
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
        </div>
      </div>

      <div className="header-bottom">
        <nav className="tabs" aria-label="Vistas del dashboard">
          {tabs.map((item) => (
            <button key={item} type="button" className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="clear-button" type="button" onClick={clearFilters}>× Limpiar filtros</button>
          <button className="data-button" type="button" onClick={onDataNotes}>Datos y notas</button>
        </div>
      </div>
    </header>
  )
}
