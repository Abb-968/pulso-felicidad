import { useMemo, useState } from 'react'
import { Line, Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine, CartesianGrid, BarChart, Bar, LabelList } from 'recharts'
import MapChart from './MapChart.jsx'
import { countryEs } from '../utils/countryCatalog.js'
import { regionEs } from '../utils/i18n.js'
import { medianIQR, topBottom } from '../utils/metrics.js'
import { fmtInt, fmtNum, fmtPct, fmtSigned } from '../utils/format.js'
import SpanishTooltip, { ScatterSpanishTooltip } from './SpanishTooltip.jsx'

const amber = 'var(--amber)'
const cobalto = 'var(--cobalt)'
const PANORAMA_DIMENSIONS = [
  { key: 'gdp_valid', label: 'PIB per cápita' },
  { key: 'social', label: 'Apoyo social' },
  { key: 'hle_norm', label: 'Esperanza de vida sana' },
  { key: 'freedom', label: 'Libertad' },
  { key: 'generosity', label: 'Generosidad' },
  { key: 'corruption', label: 'Corrupción (menos percibida)' },
]

export function KpiCards({ data, year, region }) {
  const records = data.filter((row) => row.year === year && (region === 'Todas' || row.region === region))
  const scores = records.map((row) => row.score).filter(Number.isFinite).sort((a, b) => a - b)
  const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
  const median = scores.length ? (scores.length % 2 ? scores[Math.floor(scores.length / 2)] : (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2) : null
  const base = data.filter((row) => row.year === 2015 && (region === 'Todas' || row.region === region)).map((row) => row.score)
  const baseMean = base.length ? base.reduce((a, b) => a + b, 0) / base.length : null
  const top = [...scores].reverse().slice(0, 10)
  const bottom = scores.slice(0, 10)
  const gap = top.length === 10 && bottom.length === 10 ? top.reduce((a, b) => a + b, 0) / 10 - bottom.reduce((a, b) => a + b, 0) / 10 : null
  const pairedBase = new Map(data.filter((row) => row.year === 2015).map((row) => [row.country_key, row.score]))
  const paired = records.filter((row) => pairedBase.has(row.country_key))
  const improved = paired.filter((row) => row.score > pairedBase.get(row.country_key)).length
  const pct = paired.length ? Math.round(improved / paired.length * 100) : null
  const gdpPairs = records.filter((row) => Number.isFinite(row.score) && Number.isFinite(row.gdp_valid))
  let corr = null
  if (year !== 2016 && gdpPairs.length > 1) {
    const mx = gdpPairs.reduce((s, r) => s + r.score, 0) / gdpPairs.length
    const my = gdpPairs.reduce((s, r) => s + r.gdp_valid, 0) / gdpPairs.length
    const cov = gdpPairs.reduce((s, r) => s + (r.score - mx) * (r.gdp_valid - my), 0)
    const vx = gdpPairs.reduce((s, r) => s + (r.score - mx) ** 2, 0)
    const vy = gdpPairs.reduce((s, r) => s + (r.gdp_valid - my) ** 2, 0)
    corr = cov / Math.sqrt(vx * vy)
  }
  const iqrStats = medianIQR(data, year)
  const baseMedian = medianIQR(data, 2015).median
  const notImproved = paired.length - improved
  const meanTrend = []
  for (let y = 2015; y <= 2024; y++) {
    const yearly = data.filter((row) => row.year === y && (region === 'Todas' || row.region === region)).map((row) => row.score).filter(Number.isFinite)
    const avg = yearly.length ? yearly.reduce((sum, value) => sum + value, 0) / yearly.length : null
    if (Number.isFinite(avg)) {
      meanTrend.push({ year: y, mean: avg })
    }
  }
  const meanDelta = mean - baseMean
  const medianDelta = median - baseMedian
  const meanDeltaLabel = year === 2015 ? 'Año base' : `${fmtSigned(meanDelta)} frente a 2015`
  const medianDeltaLabel = year === 2015 ? 'Año base' : `${fmtSigned(medianDelta)} frente a 2015`

  const sparkline = (() => {
    if (meanTrend.length < 2) return null
    const width = 110
    const height = 36
    const min = Math.min(...meanTrend.map((point) => point.mean))
    const max = Math.max(...meanTrend.map((point) => point.mean))
    const span = max - min || 1
    const points = meanTrend.map((point, index) => {
      const x = (index / (meanTrend.length - 1)) * (width - 4) + 2
      const y = height - ((point.mean - min) / span) * (height - 8) - 4
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    const lastPoint = points.at(-1)?.split(',')
    return {
      points: points.join(' '),
      endX: Number(lastPoint?.[0] ?? 0),
      endY: Number(lastPoint?.[1] ?? 0),
    }
  })()

  return <div className="kpi-grid">
    <article className="kpi-card main-kpi" aria-label={`Puntaje promedio global ${year}: ${fmtNum(mean)}, ${meanDeltaLabel}`}>
      <div className="main-kpi-layout">
        <div className="main-kpi-left">
          <span>PUNTAJE PROMEDIO DE FELICIDAD · {year}</span>
          <strong className="kpi-value-main">{fmtNum(mean)}</strong>
          <small>escala de 0 a 10 · {fmtInt(records.length)} países</small>
        </div>
        <div className="main-kpi-right">
          <small className={`kpi-variation ${meanDelta < 0 ? 'negative' : 'positive'}`}>{year === 2015 ? 'Año base' : `▲ ${fmtSigned(meanDelta)} vs 2015`}</small>
          <div className="kpi-spark" aria-label="Tendencia media 2015 a 2024">
            {sparkline && <svg viewBox="0 0 110 36" preserveAspectRatio="none"><polyline points={sparkline.points} fill="none" stroke="var(--text)" strokeWidth="2.5" /><circle cx={sparkline.endX} cy={sparkline.endY} r="3" fill="var(--text)" /></svg>}
          </div>
          <small className="kpi-period">2015 → 2024</small>
        </div>
      </div>
    </article>
    <article className="kpi-card" aria-label={`Mediana global ${year}: ${fmtNum(median)}, ${medianDeltaLabel}`}><span>MEDIANА GLOBAL</span><strong>{fmtNum(median)}</strong><small className={`kpi-variation ${medianDelta < 0 ? 'negative' : 'positive'}`}>{year === 2015 ? 'Año base' : `sube ${fmtSigned(medianDelta)} vs 2015`}</small><small>el país del medio de la lista · rango intercuartil {fmtNum(iqrStats.IQR)}</small></article>
    <article className="kpi-card" aria-label={`Brecha entre top 10 y bottom 10 en ${year}: ${fmtNum(gap)}`}><span>BRECHA TOP 10 − BOTTOM 10</span><strong>{fmtNum(gap)}</strong><small>distancia entre los 10 más felices y los 10 menos felices (puntos)</small></article>
    <article className="kpi-card" aria-label={year === 2015 ? `Países que mejoraron en ${year}: Año base` : `Países que mejoraron en ${year}: ${fmtInt(improved)} de ${fmtInt(paired.length)}`}><span>PAÍSES QUE MEJORARON</span><strong>{year === 2015 ? 'Año base' : fmtPct(pct)}</strong><small>{year === 2015 ? '' : `(${fmtInt(improved)} de ${fmtInt(paired.length)}) vs 2015`}</small>{year!==2015&&<div className="stacked-improved" aria-label={`${fmtInt(improved)} mejoraron, ${fmtInt(notImproved)} no mejoraron`}><i style={{width:`${pct}%`,background:'var(--amber)'}}/><i style={{width:`${100-pct}%`,background:'var(--cobalt)'}}/></div>}</article>
    <article className="kpi-card" aria-label={`Correlación PIB y felicidad ${year}: ${year===2016?'N/D':fmtNum(corr)}`}><span>CORRELACIÓN PIB–FELICIDAD</span><strong>{year===2016?'N/D':fmtNum(corr)}</strong><small>{year===2016?'PIB 2016 no confiable':`0 = sin relación · 1 = relación total · r de Pearson, ${year}`}</small></article>
  </div>
}

export function EvolutionChart({ data, region, yearSelected = 2024 }) {
  const rows = []
  for (let year = 2015; year <= 2024; year++) {
    const current = data.filter((record) => record.year === year && (region === 'Todas' || record.region === region))
    const scores = current.map((record) => record.score).filter(Number.isFinite).sort((a, b) => a - b)
    const average = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null
    const median = scores.length ? (scores.length % 2 ? scores[Math.floor(scores.length / 2)] : (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2) : null
    const q = (p) => { const pos=(scores.length-1)*p; const lo=Math.floor(pos); const hi=Math.ceil(pos); return lo===hi?scores[lo]:scores[lo]+(scores[hi]-scores[lo])*(pos-lo) }
    rows.push({ year, promedio: average, mediana: median, q1: scores.length ? q(.25) : null, q3: scores.length ? q(.75) : null })
  }
  const lastMedianYear = [...rows].reverse().find((row) => Number.isFinite(row.mediana))?.year
  const lastMeanYear = [...rows].reverse().find((row) => Number.isFinite(row.promedio))?.year
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} accessibilityLayer margin={{ left: 0, right: 110, top: 8, bottom: 4 }}><defs><linearGradient id="iqrYellow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--yellow)" stopOpacity="0.38"/><stop offset="1" stopColor="var(--yellow)" stopOpacity="0.12"/></linearGradient></defs><CartesianGrid stroke="var(--border)" /><XAxis dataKey="year" ticks={[2015,2018,2021,2024]} /><YAxis domain={[4.6,6.6]} ticks={[5,5.5,6,6.5]} tickFormatter={(value) => fmtNum(value, Number.isInteger(value) ? 0 : 2)} /><Tooltip content={<SpanishTooltip labelPrefix="Año " nameMap={{ promedio: 'Media global', mediana: 'Mediana global' }} />} isAnimationActive={false} /><Area type="monotone" dataKey="q3" stroke="none" fill="url(#iqrYellow)" isAnimationActive={false}/><Area type="monotone" dataKey="q1" stroke="none" fill="var(--card)" fillOpacity="1" isAnimationActive={false}/><Line type="monotone" dataKey="mediana" name="Mediana global" stroke="var(--text)" strokeWidth={3} dot={false} isAnimationActive={false}><LabelList dataKey="mediana" content={({ index, x, y, value }) => rows[index]?.year === lastMedianYear && Number.isFinite(value) ? <text x={x + 8} y={y + 4} fill="var(--text)" fontSize={12}>{`Mediana ${fmtNum(value)}`}</text> : null} /></Line><Line type="monotone" dataKey="promedio" name="Media global" stroke="var(--amber)" strokeWidth={3} dot={false} isAnimationActive={false}><LabelList dataKey="promedio" content={({ index, x, y, value }) => rows[index]?.year === lastMeanYear && Number.isFinite(value) ? <text x={x + 8} y={y + 4} fill="var(--text)" fontSize={12}>{`Media ${fmtNum(value)}`}</text> : null} /></Line><ReferenceLine x={yearSelected} stroke="var(--text-2)" strokeDasharray="4 4" /></AreaChart></ResponsiveContainer>
}

export function HorizontalRanking({ records, year, type = 'top' }) {
  const rankings = topBottom(records, year, 10)
  const selected = rankings[type]
  const chartData = selected.map((row) => {
    const translated = countryEs(row.country)
    const countryLabel = type === 'bottom' && translated === 'República Democrática del Congo'
      ? 'R. D. del Congo'
      : translated
    return { ...row, countryEs: countryLabel }
  })
  return <ResponsiveContainer width="100%" height={230}><BarChart data={chartData} accessibilityLayer layout="vertical" margin={{ left: 20, right: 42 }}><XAxis type="number" domain={[0, 8]} tickFormatter={(value) => fmtNum(value, Number.isInteger(value) ? 0 : 2)} /><YAxis type="category" dataKey="countryEs" width={type === 'bottom' ? 155 : 118} interval={0} tick={{ fontSize: 12 }} /><Tooltip content={<SpanishTooltip nameMap={{ score: 'Puntaje' }} />} isAnimationActive={false} /><Bar dataKey="score" name="Puntaje" fill={type === 'top' ? amber : cobalto} radius={[0, 4, 4, 0]} isAnimationActive={false}><LabelList dataKey="score" position="right" formatter={(value) => fmtNum(value)} /></Bar></BarChart></ResponsiveContainer>
}

export function RegionAverage({ data, year, region }) {
  const rows = data.filter((row) => row.year === year && (region === 'Todas' || row.region === region)).reduce((map, row) => {
    const values = map.get(row.region) || []
    values.push(row.score)
    map.set(row.region, values)
    return map
  }, new Map())
  const all = data.filter((row) => row.year === year && (region === 'Todas' || row.region === region))
  const average = all.length ? all.reduce((sum, row) => sum + row.score, 0) / all.length : null
  const chartData = [...rows].map(([name, scores]) => ({ name: regionEs(name), score: scores.reduce((sum, value) => sum + value, 0) / scores.length })).sort((a, b) => b.score - a.score)
  const chartHeight = Math.max(220, chartData.length * 30)
  return <ResponsiveContainer width="100%" height={chartHeight}><BarChart data={chartData} accessibilityLayer layout="vertical" margin={{ top: 20, right: 32, left: 20 }}><XAxis type="number" domain={[0, 8]} /><YAxis type="category" dataKey="name" width={205} interval={0} tick={{ fontSize: 12 }} /><Tooltip content={<SpanishTooltip nameMap={{ score: 'Promedio regional' }} />} isAnimationActive={false} /><ReferenceLine x={average} stroke="var(--text-2)" strokeDasharray="5 4" label={{ value: `Promedio global ${fmtNum(average)}`, position: 'top', fill: 'var(--text-2)', fontSize: 12 }} /><Bar dataKey="score" name="Promedio regional" isAnimationActive={false} radius={[0, 4, 4, 0]} shape={(props) => { const {x,y,width,height,payload} = props; return <rect x={x} y={y} width={width} height={height} rx={4} fill={payload.score >= average ? 'var(--amber)' : 'var(--cobalt)'}/> }}><LabelList dataKey="score" position="right" formatter={(value) => fmtNum(value)} /></Bar></BarChart></ResponsiveContainer>
}

export function ScatterPanel({ records, year, countryKey, onOpenDataNotes, dimension = 'gdp_valid' }) {
  const dimensionLabel = PANORAMA_DIMENSIONS.find((item) => item.key === dimension)?.label ?? 'PIB per cápita'
  if (dimension === 'gdp_valid' && year === 2016) return <div className="not-comparable"><strong>N/D</strong><p>Sin datos de PIB para 2016. Elige otro año u otra dimensión.</p><button type="button" onClick={onOpenDataNotes}>Ver notas</button></div>
  const chartData = records.filter((row) => Number.isFinite(row[dimension]) && Number.isFinite(row.score))
  if (!chartData.length) return <div className="not-comparable"><strong>N/D</strong><p>No hay datos comparables.</p></div>
  const mx = chartData.reduce((sum,row)=>sum+row[dimension],0)/chartData.length
  const my = chartData.reduce((sum,row)=>sum+row.score,0)/chartData.length
  const cov = chartData.reduce((sum,row)=>sum+(row[dimension]-mx)*(row.score-my),0)
  const vx = chartData.reduce((sum,row)=>sum+(row[dimension]-mx)**2,0)
  const slope = vx ? cov/vx : 0
  const intercept = my-slope*mx
  const xDomain = (() => {
    if (dimension === 'gdp_valid') return [0, 10]
    if (dimension === 'hle_norm') return [0, 1]
    return [0, 1]
  })()
  const xTicks = dimension === 'gdp_valid' ? [0, 2.5, 5, 7.5, 10] : [0, 0.25, 0.5, 0.75, 1]
  const regression = [{ [dimension]: xDomain[0], score: intercept + slope * xDomain[0] }, { [dimension]: xDomain[1], score: intercept + slope * xDomain[1] }]
  return <ResponsiveContainer width="100%" height={220}><ScatterChart accessibilityLayer margin={{ top: 10, right: 12, bottom: 18, left: 36 }}><CartesianGrid stroke="var(--border)" /><XAxis type="number" dataKey={dimension} name={dimensionLabel} domain={xDomain} ticks={xTicks} tickFormatter={(value) => fmtNum(value, Number.isInteger(value) ? 0 : 2)} label={{value:dimension === 'gdp_valid' ? 'Índice de PIB per cápita (0 a 10)' : `${dimensionLabel} (0 a 1)`,position:'insideBottom',offset:-12,fill:'var(--text-2)',fontSize:12}} /><YAxis type="number" dataKey="score" name="Puntaje" domain={[2,8]} ticks={[2,4,6,8]} width={64} tickFormatter={(value) => fmtNum(value, Number.isInteger(value) ? 0 : 2)} label={{value:'Puntaje',angle:-90,position:'insideLeft',fill:'var(--text-2)',fontSize:12,dx:-2}} /><Tooltip content={<ScatterSpanishTooltip dimensionName={dimensionLabel} dimensionKey={dimension} />} cursor={{ strokeDasharray:'3 3' }} isAnimationActive={false} /><Scatter data={chartData.map(row=>({...row, fill:row.country_key===countryKey?'var(--cobalt)':'var(--amber)'}))} name="Puntaje" fill="var(--amber)" shape={(props)=>{const {cx,cy,payload}=props;return <circle cx={cx} cy={cy} r={payload.country_key===countryKey?6:3.5} fill={payload.country_key===countryKey?'var(--cobalt)':'var(--amber)'} opacity="0.8"/>}} isAnimationActive={false}/><Scatter data={regression} line={{stroke:'var(--text)',strokeWidth:2}} fill="transparent" shape={()=>null} isAnimationActive={false}/></ScatterChart></ResponsiveContainer>
}

export default function Panorama({ data, year, region, onSelectCountry, countryKey, onOpenDataNotes }) {
  const [scatterDimension, setScatterDimension] = useState('gdp_valid')
  const selectedScatterDimension = useMemo(() => PANORAMA_DIMENSIONS.find((item) => item.key === scatterDimension) ?? PANORAMA_DIMENSIONS[0], [scatterDimension])
  const records = data.filter((row) => row.year === year && (region === 'Todas' || row.region === region))
  const evolutionSummary = (() => {
    const summarizeYear = (targetYear) => {
      const values = data
        .filter((row) => row.year === targetYear && (region === 'Todas' || row.region === region))
        .map((row) => row.score)
        .filter(Number.isFinite)
        .sort((a, b) => a - b)
      if (!values.length) return { mean: null, median: null }
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length
      const median = values.length % 2
        ? values[Math.floor(values.length / 2)]
        : (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      return { mean, median }
    }

    const current = summarizeYear(year)
    const baseline = summarizeYear(2015)
    if (!Number.isFinite(current.median) || !Number.isFinite(current.mean) || !Number.isFinite(baseline.median) || !Number.isFinite(baseline.mean)) {
      return 'Sin datos comparables contra 2015'
    }

    const medianDelta = current.median - baseline.median
    const meanDelta = current.mean - baseline.mean
    const medianVerb = medianDelta >= 0 ? 'subió' : 'bajó'
    const meanPhrase = meanDelta >= 0 ? `solo ${fmtNum(Math.abs(meanDelta))}` : `bajó ${fmtNum(Math.abs(meanDelta))}`

    return `La mediana ${medianVerb} ${fmtNum(Math.abs(medianDelta))} desde 2015; la media, ${meanPhrase}`
  })()

  return <>
    <KpiCards data={data} year={year} region={region} />
    <div className="dashboard-grid panorama-grid">
      <section className="panel map-panel"><div className="panel-heading"><div><h2>Distribución geográfica del puntaje</h2><p>Escala fija 1.7–7.8 · {year}</p></div></div><MapChart records={records} year={year} onSelectCountry={onSelectCountry} /></section>
      <section className="panel panel-evolution"><div className="panel-heading"><div><h2>Evolución 2015-2024: media y mediana</h2><p>{evolutionSummary}</p></div></div><div className="evolution-chart-wrap"><EvolutionChart data={data} region={region} yearSelected={year} /></div></section>
      <section className="panel"><div className="panel-heading"><h2>Top 10 / Bottom 10 ({year})</h2></div><p className="ranking-group-title">10 mejores</p><HorizontalRanking records={records} year={year} type="top" /><p className="ranking-group-title">10 peores</p><HorizontalRanking records={records} year={year} type="bottom" /></section>
      <section className="panel"><div className="panel-heading"><h2>Promedio por región ({year})</h2></div><RegionAverage data={data} year={year} region={region} /></section>
      <section className="panel"><div className="panel-heading"><h2>{selectedScatterDimension.label} vs felicidad ({year})</h2><label className="panel-inline-control"><span>Dimensión</span><select value={scatterDimension} onChange={(event) => setScatterDimension(event.target.value)}>{PANORAMA_DIMENSIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label></div><ScatterPanel records={records} year={year} countryKey={countryKey} onOpenDataNotes={onOpenDataNotes} dimension={scatterDimension} /></section>
    </div>
  </>
}
