import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, LabelList, ReferenceLine, Cell } from 'recharts'
import { countryEs } from '../utils/countryCatalog.js'
import { regionEs } from '../utils/i18n.js'
import { percentileByDimension, regionalRank } from '../utils/metrics.js'
import { fmtInt, fmtNum, fmtSigned } from '../utils/format.js'
import SpanishTooltip from './SpanishTooltip.jsx'

const labels = {
  gdp_valid: 'PIB per cápita',
  social: 'Apoyo social',
  hle_norm: 'Esperanza de vida sana',
  freedom: 'Libertad',
  generosity: 'Generosidad',
  corruption: 'Corrupción (menos percibida)',
}

const COMPARE_COLORS = ['#0F766E', '#0EA5E9']
const MAX_COUNTRIES_IN_EVOLUTION = 3

export default function CountryView({ data, year, countryKey, setCountryKey, search, onRecover }) {
  const [compareCountryKeys, setCompareCountryKeys] = useState([])
  const activeCompareCountryKeys = compareCountryKeys.filter((key) => key !== countryKey)
  const countries = useMemo(() => [...new Map(data.map((row) => [row.country_key, row.country])).entries()].map(([key, name]) => ({ key, name, nameEs: countryEs(name) })).sort((a, b) => a.nameEs.localeCompare(b.nameEs, 'es')), [data])
  const current = data.find((row) => row.year === year && row.country_key === countryKey)
  const base = data.find((row) => row.year === 2015 && row.country_key === countryKey)
  const filteredSearch = countries.filter((row) => row.nameEs.toLowerCase().includes(search.toLowerCase()) || row.name.toLowerCase().includes(search.toLowerCase()))
  const currentCountries = data.filter((row) => row.year === year)
  const regionRows = current ? data.filter((row) => row.year === year && row.region === current.region) : []
  const regionAverage = regionRows.length ? regionRows.reduce((sum, row) => sum + row.score, 0) / regionRows.length : null
  const globalAverage = currentCountries.length ? currentCountries.reduce((sum, row) => sum + row.score, 0) / currentCountries.length : null
  const regionRanking = regionalRank(data, countryKey, year)

  const compareSeries = useMemo(() => activeCompareCountryKeys.map((key, index) => {
    const country = countries.find((row) => row.key === key)
    return {
      key,
      dataKey: `compare_${index}`,
      label: country?.nameEs ?? key,
      color: COMPARE_COLORS[index % COMPARE_COLORS.length],
    }
  }), [activeCompareCountryKeys, countries])

  const evolution = useMemo(() => {
    const rows = []
    for (let y = 2015; y <= 2024; y++) {
      const countryRow = data.find((row) => row.year === y && row.country_key === countryKey)
      const yearRows = data.filter((row) => row.year === y)
      const regionRowsForYear = countryRow ? data.filter((row) => row.year === y && row.region === countryRow.region) : []
      const row = {
        year: y,
        country: countryRow?.score ?? null,
        world: yearRows.length ? yearRows.reduce((sum, item) => sum + item.score, 0) / yearRows.length : null,
        region: regionRowsForYear.length ? regionRowsForYear.reduce((sum, item) => sum + item.score, 0) / regionRowsForYear.length : null,
      }
      compareSeries.forEach((series) => {
        const compareRow = data.find((item) => item.year === y && item.country_key === series.key)
        row[series.dataKey] = compareRow?.score ?? null
      })
      rows.push(row)
    }
    return rows
  }, [data, countryKey, compareSeries])

  const percentiles = percentileByDimension(data, countryKey, year)
  const dimensionRows = current ? Object.keys(labels).map((key) => ({
    name: labels[key],
    percentile: Number.isFinite(percentiles[key]) ? Math.round(percentiles[key]) : null,
  })) : []
  const yearlySummary = useMemo(() => {
    const rows = []
    for (let y = 2015; y <= 2024; y++) {
      const rowsForYear = data.filter((row) => row.year === y && Number.isFinite(row.score))
      const sorted = [...rowsForYear].sort((a, b) => b.score - a.score)
      const countryRow = sorted.find((row) => row.country_key === countryKey)
      const yearlyRank = countryRow ? sorted.findIndex((row) => row.country_key === countryKey) + 1 : null
      rows.push({
        year: y,
        score: countryRow?.score ?? null,
        rank: yearlyRank,
        total: rowsForYear.length,
      })
    }
    return rows
  }, [data, countryKey])
  const currentYearSummary = yearlySummary.find((row) => row.year === year) ?? { rank: null, total: 0 }
  const baseYearSummary = yearlySummary.find((row) => row.year === 2015) ?? { rank: null, total: 0 }
  const regionalContext = useMemo(() => {
    if (!current) return []
    const ranked = data
      .filter((row) => row.year === year && row.region === current.region && Number.isFinite(row.score))
      .sort((a, b) => b.score - a.score)
      .map((row, index) => ({
        rank: index + 1,
        country: countryEs(row.country),
        countryKey: row.country_key,
        score: row.score,
      }))
    const selectedIndex = ranked.findIndex((row) => row.countryKey === countryKey)
    if (selectedIndex === -1) return ranked.slice(0, 8)
    const start = Math.max(0, Math.min(ranked.length - 8, selectedIndex - 1))
    return ranked.slice(start, start + 8)
  }, [data, year, current, countryKey])

  const evolutionNameMap = useMemo(() => {
    if (!current) return {}
    const labelsMap = {
      country: countryEs(current.country),
      region: 'Promedio regional',
      world: 'Promedio mundial',
    }
    compareSeries.forEach((series) => {
      labelsMap[series.dataKey] = series.label
    })
    return labelsMap
  }, [current, compareSeries])

  const lastYearBySeries = useMemo(() => {
    const keys = ['country', 'region', 'world', ...compareSeries.map((series) => series.dataKey)]
    return Object.fromEntries(keys.map((key) => {
      const last = [...evolution].reverse().find((row) => Number.isFinite(row[key]))
      return [key, last?.year ?? null]
    }))
  }, [evolution, compareSeries])

  const compareCandidates = countries.filter((row) => row.key !== countryKey && !activeCompareCountryKeys.includes(row.key))

  if (!current) return <>
    <div className="country-selector"><label>País seleccionado<select value={countryKey} onChange={(event) => setCountryKey(event.target.value)} translate="no" className="notranslate">{(search ? filteredSearch : countries).map((row) => <option key={row.key} value={row.key} translate="no" className="notranslate">{row.nameEs}</option>)}</select></label></div>
    <div className="empty-state"><h2>País no disponible</h2><p>No hay observación para esta combinación de país y año.</p><button type="button" className="recovery-button" onClick={onRecover}>Limpiar filtros</button></div>
  </>

  const change = base ? current.score - base.score : null
  const regionDiff = Number.isFinite(current.score) && Number.isFinite(regionAverage) ? current.score - regionAverage : null
  const worldDiff = Number.isFinite(current.score) && Number.isFinite(globalAverage) ? current.score - globalAverage : null
  const regionLabel = `${regionEs(current.region).toUpperCase()} · PUNTAJE ${year}`
  const direction = change < 0 ? '▼' : '▲'
  const canAddComparison = compareSeries.length < MAX_COUNTRIES_IN_EVOLUTION - 1
  const renderEndLabel = (dataKey, label, color) => ({ index, x, y, value }) => {
    const row = evolution[index]
    if (!row || row.year !== lastYearBySeries[dataKey] || !Number.isFinite(value)) return null
    return <text x={x + 8} y={y + 4} fill={color} fontSize={12} translate="no" className="notranslate">{`${label} ${fmtNum(value)}`}</text>
  }

  return <>
    <div className="country-selector"><label>País seleccionado<select value={countryKey} onChange={(event) => setCountryKey(event.target.value)} translate="no" className="notranslate">{(search ? filteredSearch : countries).map((row) => <option key={row.key} value={row.key} translate="no" className="notranslate">{row.nameEs}</option>)}</select></label></div>
    <div className="country-selector country-selector-compare"><label>+ Añadir país (máx. 3)<select value="" onChange={(event) => {
      const key = event.target.value
      if (!key || !canAddComparison) return
      setCompareCountryKeys((previous) => [...previous, key])
    }} disabled={!canAddComparison} translate="no" className="notranslate"><option value="">{canAddComparison ? 'Seleccionar país...' : 'Máximo alcanzado (3 países)'}</option>{compareCandidates.map((row) => <option key={row.key} value={row.key} translate="no" className="notranslate">{row.nameEs}</option>)}</select></label>{compareSeries.length > 0 && <div className="country-compare-tags">{compareSeries.map((series) => <button key={series.key} type="button" className="country-compare-tag" onClick={() => setCompareCountryKeys((previous) => previous.filter((key) => key !== series.key))} translate="no"><span className="dot" style={{ background: series.color }} aria-hidden="true" />{series.label} ×</button>)}</div>}</div>
    <div className="country-summary"><article className="country-main" aria-label={`${countryEs(current.country)} ${year}. Puntaje ${fmtNum(current.score)}. ${year === 2015 || change === null ? 'Año base' : `${fmtSigned(change)} frente a 2015`}. Lugar ${fmtInt(currentYearSummary.rank)} de ${fmtInt(currentYearSummary.total)}`}><span className="country-main-subtitle">{regionLabel}</span><strong className="country-main-name" translate="no">{countryEs(current.country)}</strong><div className="country-main-score">{fmtNum(current.score)}</div><small className={`country-main-delta ${change < 0 ? 'negative' : 'positive'}`}>{year === 2015 || change === null ? 'Año base' : `${direction} ${fmtSigned(change)} vs 2015`}</small><small>Lugar {fmtInt(currentYearSummary.rank)} de {fmtInt(currentYearSummary.total)} · en 2015: lugar {fmtInt(baseYearSummary.rank)} de {fmtInt(baseYearSummary.total)}</small></article>
      <article><span>Frente a su región</span><strong>{fmtSigned(regionDiff)}</strong><small>vs promedio regional {fmtNum(regionAverage)}</small></article>
      <article><span>Frente al mundo</span><strong>{fmtSigned(worldDiff)}</strong><small>vs promedio global {fmtNum(globalAverage)}</small></article>
      <article><span>Cambio 2015-2024</span><strong className={change < 0 ? 'country-change-negative' : ''}>{year === 2015 || change === null ? 'Año base' : fmtSigned(change)}</strong><small>{year === 2015 ? 'Periodo base' : 'vs 2015'}</small></article>
      <article><span>Lugar en región</span><strong>{regionRanking.rank ? `${fmtInt(regionRanking.rank)}.º` : 'N/D'}</strong><small>de {fmtInt(regionRanking.total)} países</small></article>
    </div>
    <div className="dashboard-grid country-grid">
      <section className="panel" aria-label={`Evolución de ${countryEs(current.country)} frente a región y mundo`}><div className="panel-heading"><h2>Evolución de <span translate="no">{countryEs(current.country)}</span> frente al mundo</h2></div><ResponsiveContainer width="100%" height={300}><LineChart accessibilityLayer data={evolution} margin={{ top: 8, right: 130, left: 4, bottom: 4 }}><CartesianGrid stroke="var(--border)" /><XAxis dataKey="year" /><YAxis domain={[5, 7.5]} ticks={[5, 5.5, 6, 6.5, 7, 7.5]} /><Tooltip content={<SpanishTooltip labelPrefix="Año " nameMap={evolutionNameMap} />} isAnimationActive={false} /><Line dataKey="country" stroke="#2563EB" strokeWidth={4} dot={false} isAnimationActive={false}><LabelList dataKey="country" content={renderEndLabel('country', countryEs(current.country), '#2563EB')} /></Line>{compareSeries.map((series) => <Line key={series.dataKey} dataKey={series.dataKey} stroke={series.color} strokeWidth={2} dot={false} isAnimationActive={false}><LabelList dataKey={series.dataKey} content={renderEndLabel(series.dataKey, series.label, series.color)} /></Line>)}<Line dataKey="region" stroke="#D97706" strokeWidth={2} dot={false} isAnimationActive={false}><LabelList dataKey="region" content={renderEndLabel('region', 'Región', '#1E293B')} /></Line><Line dataKey="world" stroke="#1E293B" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false}><LabelList dataKey="world" content={renderEndLabel('world', 'Mundo', '#1E293B')} /></Line></LineChart></ResponsiveContainer></section>
      <section className="panel" aria-label={`Percentiles de ${countryEs(current.country)} por dimensión para ${year}`}><div className="panel-heading"><h2>Dimensiones destacadas (percentil)</h2></div><ResponsiveContainer width="100%" height={300}><BarChart accessibilityLayer data={dimensionRows} layout="vertical" margin={{ top: 22, left: 12, right: 34 }}><CartesianGrid stroke="var(--border)" /><XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} /><YAxis type="category" dataKey="name" width={170} interval={0} tick={{ fontSize: 12 }} /><Tooltip content={<SpanishTooltip nameMap={{ percentile: `Percentil de ${countryEs(current.country)}` }} />} isAnimationActive={false} /><ReferenceLine x={50} stroke="var(--text-2)" strokeDasharray="5 4" label={{ value: 'Mediana mundial', position: 'top', fill: 'var(--text-2)', fontSize: 12 }} /><Bar dataKey="percentile" name={`Percentil de ${countryEs(current.country)}`} isAnimationActive={false}><LabelList dataKey="percentile" position="right" formatter={(value) => Number.isFinite(value) ? fmtNum(value, 0) : 'N/D'} />{dimensionRows.map((row) => <Cell key={row.name} fill={!Number.isFinite(row.percentile) ? 'var(--nodata)' : row.percentile >= 50 ? '#D97706' : '#2563EB'} />)}</Bar></BarChart></ResponsiveContainer></section>
      <section className="panel" aria-label={`Ranking regional de ${countryEs(current.country)} en ${year}`}><div className="panel-heading"><h2>Su lugar en la región ({year})</h2></div><ResponsiveContainer width="100%" height={300}><BarChart accessibilityLayer data={regionalContext} layout="vertical" margin={{ left: 8, right: 36 }}><CartesianGrid stroke="var(--border)" /><XAxis type="number" domain={[0, 8]} /><YAxis type="category" dataKey="country" width={168} interval={0} tick={{ fontSize: 12 }} tickFormatter={(_, index) => { const row = regionalContext[index]; return row ? `${row.rank}. ${row.country}` : '' }} /><Tooltip content={<SpanishTooltip nameMap={{ score: 'Puntaje' }} />} isAnimationActive={false} /><Bar dataKey="score" name="Puntaje" isAnimationActive={false}>{regionalContext.map((row) => <Cell key={row.countryKey} fill={row.countryKey === countryKey ? '#2563EB' : '#FDE68A'} />)}<LabelList dataKey="score" position="right" formatter={(value) => fmtNum(value)} /></Bar></BarChart></ResponsiveContainer></section>
      <section className="panel"><div className="panel-heading"><h2>Puntaje y lugar por año</h2></div><div className="table-scroll"><table><thead><tr><th>Año</th><th>Puntaje</th><th>Lugar</th><th>Países con datos</th></tr></thead><tbody>{yearlySummary.map((row) => <tr key={row.year} className={row.year === year ? 'selected-year-row' : ''}><td>{row.year}</td><td>{row.score === null ? 'N/D' : fmtNum(row.score)}</td><td>{row.rank === null ? 'N/D' : fmtInt(row.rank)}</td><td>{fmtInt(row.total)}</td></tr>)}</tbody></table></div></section>
    </div>
  </>
}
