import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'
import { countryEs } from '../utils/countryCatalog.js'
import { regionEs } from '../utils/i18n.js'
import { regionalRank } from '../utils/metrics.js'
import SpanishTooltip from './SpanishTooltip.jsx'

const labels = { gdp_valid: 'PIB per cápita', social: 'Apoyo social', hle_norm: 'Esperanza de vida', freedom: 'Libertad', generosity: 'Generosidad', corruption: 'Corrupción' }

export default function CountryView({ data, year, countryKey, setCountryKey, search }) {
  const countries = useMemo(() => [...new Map(data.map((row) => [row.country_key, row.country])).entries()].map(([key, name]) => ({ key, name, nameEs: countryEs(name) })).sort((a, b) => a.nameEs.localeCompare(b.nameEs, 'es')), [data])
  const current = data.find((row) => row.year === year && row.country_key === countryKey)
  const base = data.find((row) => row.year === 2015 && row.country_key === countryKey)
  const filteredSearch = countries.filter((row) => row.nameEs.toLowerCase().includes(search.toLowerCase()) || row.name.toLowerCase().includes(search.toLowerCase()))
  const currentCountries = data.filter((row) => row.year === year)
  const rank = current ? [...currentCountries].sort((a, b) => b.score - a.score).findIndex((row) => row.country_key === countryKey) + 1 : null
  const regionRows = current ? data.filter((row) => row.year === year && row.region === current.region) : []
  const regionAverage = regionRows.length ? regionRows.reduce((sum, row) => sum + row.score, 0) / regionRows.length : null
  const globalAverage = currentCountries.length ? currentCountries.reduce((sum, row) => sum + row.score, 0) / currentCountries.length : null
  const regionRanking = regionalRank(data, countryKey, year)

  const evolution = []
  for (let y = 2015; y <= 2024; y++) {
    const countryRow = data.find((row) => row.year === y && row.country_key === countryKey)
    const yearRows = data.filter((row) => row.year === y)
    const regionRowsForYear = countryRow ? data.filter((row) => row.year === y && row.region === countryRow.region) : []
    evolution.push({ year: y, country: countryRow?.score ?? null, world: yearRows.length ? yearRows.reduce((s, r) => s + r.score, 0) / yearRows.length : null, region: regionRowsForYear.length ? regionRowsForYear.reduce((s, r) => s + r.score, 0) / regionRowsForYear.length : null })
  }

  const dimensionRows = current ? Object.keys(labels).map((key) => {
    const yearRows = data.filter((row) => row.year === year && Number.isFinite(row[key]))
    const globalValue = yearRows.length ? yearRows.reduce((sum, row) => sum + row[key], 0) / yearRows.length : null
    return { name: labels[key], country: current[key], global: globalValue }
  }) : []

  if (!current) return <div className="empty-state"><h2>País no disponible</h2><p>No hay observación para esta combinación de país y año.</p></div>

  const change = base ? current.score - base.score : null
  return <>
    <div className="country-selector"><label>País seleccionado<select value={countryKey} onChange={(event) => setCountryKey(event.target.value)}>{(search ? filteredSearch : countries).map((row) => <option key={row.key} value={row.key}>{row.nameEs}</option>)}</select></label></div>
    <div className="country-summary"><article className="country-main"><strong>{countryEs(current.country)}</strong><div><span>Puntaje</span><b>{current.score.toFixed(2)}</b></div><small>{change === null ? 'Año base' : `${change >= 0 ? '+' : ''}${change.toFixed(2)} vs 2015 · lugar ${rank} de ${currentCountries.length}`}</small></article>
      <article><span>Frente a su región</span><strong>{(current.score - regionAverage).toFixed(2)}</strong><small>vs promedio regional {regionAverage?.toFixed(2)}</small></article>
      <article><span>Frente al mundo</span><strong>{(current.score - globalAverage).toFixed(2)}</strong><small>vs promedio mundial {globalAverage?.toFixed(2)}</small></article>
      <article><span>Cambio 2015–2024</span><strong>{change === null ? 'Año base' : `${change >= 0 ? '+' : ''}${change.toFixed(2)} pts`}</strong><small>puntos de felicidad</small></article>
      <article><span>Lugar en región</span><strong>{regionRanking.rank ? `${regionRanking.rank}.º` : 'N/D'}</strong><small>de {regionRanking.total} países</small></article>
    </div>
    <div className="dashboard-grid country-grid">
      <section className="panel"><div className="panel-heading"><h2>Evolución de {countryEs(current.country)} frente al mundo</h2></div><ResponsiveContainer width="100%" height={300}><LineChart data={evolution}><CartesianGrid stroke="var(--border)" /><XAxis dataKey="year" /><YAxis domain={[4.5, 8]} /><Tooltip content={<SpanishTooltip labelPrefix="Año " nameMap={{ country: countryEs(current.country), region: 'Promedio regional', world: 'Promedio mundial' }} />} isAnimationActive={false} /><Line dataKey="country" stroke="#2563EB" strokeWidth={4} dot isAnimationActive={false} /><Line dataKey="region" stroke="#D97706" strokeWidth={2} dot={false} isAnimationActive={false} /><Line dataKey="world" stroke="#1E293B" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></section>
      <section className="panel"><div className="panel-heading"><h2>Dimensiones destacadas</h2></div><ResponsiveContainer width="100%" height={300}><BarChart data={dimensionRows} layout="vertical" margin={{ left: 10, right: 25 }}><XAxis type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} /><YAxis type="category" dataKey="name" width={120} /><Tooltip content={<SpanishTooltip nameMap={{ country: countryEs(current.country), global: 'Promedio mundial' }} />} isAnimationActive={false} /><Bar dataKey="country" fill="#2563EB" name={countryEs(current.country)} isAnimationActive={false} /><Bar dataKey="global" fill="#D97706" name="Promedio mundial" isAnimationActive={false} /></BarChart></ResponsiveContainer></section>
    </div>
  </>
}
