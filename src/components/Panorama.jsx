import { LineChart, Line, Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine, CartesianGrid, BarChart, Bar, LabelList } from 'recharts'
import MapChart from './MapChart.jsx'
import { countryEs } from '../utils/countryCatalog.js'
import { regionEs } from '../utils/i18n.js'
import { medianIQR, topBottom } from '../utils/metrics.js'
import SpanishTooltip, { ScatterSpanishTooltip } from './SpanishTooltip.jsx'

const amber = 'var(--amber)'
const cobalto = 'var(--cobalt)'

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

  return <div className="kpi-grid">
    <article className="kpi-card main-kpi">
      <span>PUNTAJE PROMEDIO DE FELICIDAD · {year}</span>
      <strong>{mean?.toFixed(2) ?? 'N/D'}</strong>
      <small>{year === 2015 ? 'Año base' : `▲ +${(mean-baseMean).toFixed(2)} vs 2015`}</small>
      <div className="kpi-spark" aria-label="Tendencia 2015 a 2024"><svg viewBox="0 0 180 44" preserveAspectRatio="none"><polyline points="2,34 24,30 46,32 68,27 90,25 112,19 134,12 156,10 178,7" fill="none" stroke="var(--text)" strokeWidth="3" /><circle cx="178" cy="7" r="4" fill="var(--text)" /></svg></div>
      <small>escala de 0 a 10 · {records.length} países</small>
    </article>
    <article className="kpi-card"><span>MEDIANА GLOBAL</span><strong>{median?.toFixed(2) ?? 'N/D'}</strong><small>{year === 2015 ? 'Año base' : `sube +${(median-baseMedian).toFixed(2)} vs 2015`}</small><small>IQR {iqrStats.IQR?.toFixed(2) ?? 'N/D'}</small></article>
    <article className="kpi-card"><span>BRECHA TOP 10 – BOTTOM 10</span><strong>{gap?.toFixed(2) ?? 'N/D'}</strong><small>distancia entre los 10 más felices y los 10 menos felices (puntos)</small></article>
    <article className="kpi-card"><span>PAÍSES QUE MEJORARON</span><strong>{year === 2015 ? 'Año base' : `${pct}%`}</strong><small>{year === 2015 ? '' : `${improved} de ${paired.length} países vs 2015`}</small>{year!==2015&&<div className="stacked-improved" aria-label={`${improved} mejoraron, ${notImproved} no mejoraron`}><i style={{width:`${pct}%`,background:'var(--amber)'}}/><i style={{width:`${100-pct}%`,background:'var(--cobalt)'}}/></div>}</article>
    <article className="kpi-card"><span>CORRELACIÓN PIB–FELICIDAD</span><strong>{year===2016?'N/D':corr?.toFixed(2) ?? 'N/D'}</strong><small>{year===2016?'PIB 2016 no confiable · ver Datos y notas':`0 = sin relación · 1 = relación total · r de Pearson, ${year}`}</small></article>
  </div>
}

export function EvolutionChart({ data, region, yearSelected = 2024, countryKey }) {
  const rows = []
  for (let year = 2015; year <= 2024; year++) {
    const current = data.filter((record) => record.year === year && (region === 'Todas' || record.region === region))
    const scores = current.map((record) => record.score).filter(Number.isFinite).sort((a, b) => a - b)
    const average = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null
    const median = scores.length ? (scores.length % 2 ? scores[Math.floor(scores.length / 2)] : (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2) : null
    const q = (p) => { const pos=(scores.length-1)*p; const lo=Math.floor(pos); const hi=Math.ceil(pos); return lo===hi?scores[lo]:scores[lo]+(scores[hi]-scores[lo])*(pos-lo) }
    rows.push({ year, promedio: average, mediana: median, q1: scores.length ? q(.25) : null, q3: scores.length ? q(.75) : null })
  }
  const final = rows.at(-1)
  return <ResponsiveContainer width="100%" height={230}><AreaChart data={rows} margin={{ left: 0, right: 58, top: 8, bottom: 4 }}><defs><linearGradient id="iqrYellow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--yellow)" stopOpacity="0.38"/><stop offset="1" stopColor="var(--yellow)" stopOpacity="0.12"/></linearGradient></defs><CartesianGrid stroke="var(--border)" /><XAxis dataKey="year" ticks={[2015,2018,2021,2024]} /><YAxis domain={[5,6.5]} ticks={[5,5.5,6,6.5]} /><Tooltip content={<SpanishTooltip labelPrefix="Año " nameMap={{ promedio: 'Media global', mediana: 'Mediana global' }} />} isAnimationActive={false} /><Area type="monotone" dataKey="q3" stroke="none" fill="url(#iqrYellow)" isAnimationActive={false}/><Area type="monotone" dataKey="q1" stroke="none" fill="var(--card)" fillOpacity="1" isAnimationActive={false}/><Line type="monotone" dataKey="mediana" name="Mediana global" stroke="var(--text)" strokeWidth={3} dot={false} isAnimationActive={false}><LabelList dataKey="mediana" position="right" formatter={(value,index) => index===rows.length-1?`Mediana ${value?.toFixed(2)}`:''}/></Line><Line type="monotone" dataKey="promedio" name="Media global" stroke="var(--amber)" strokeWidth={3} dot={false} isAnimationActive={false}><LabelList dataKey="promedio" position="right" formatter={(value,index) => index===rows.length-1?`Media ${value?.toFixed(2)}`:''}/></Line><ReferenceLine x={yearSelected} stroke="var(--text-2)" strokeDasharray="4 4" /></AreaChart></ResponsiveContainer>
}

export function HorizontalRanking({ records, year, type = 'top' }) {
  const rankings = topBottom(records, year, 10)
  const selected = rankings[type]
  const chartData = [...selected].reverse().map((row) => ({ ...row, countryEs: countryEs(row.country) }))
  return <ResponsiveContainer width="100%" height={220}><BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 42 }}><XAxis type="number" domain={[0, 8]} /><YAxis type="category" dataKey="countryEs" width={105} interval={0} tick={{ fontSize: 12 }} /><Tooltip content={<SpanishTooltip nameMap={{ score: 'Puntaje' }} />} isAnimationActive={false} /><Bar dataKey="score" name="Puntaje" fill={type === 'top' ? amber : cobalto} radius={[0, 4, 4, 0]} isAnimationActive={false}><LabelList dataKey="score" position="right" formatter={(value) => Number(value).toFixed(2)} /></Bar></BarChart></ResponsiveContainer>
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
  return <ResponsiveContainer width="100%" height={220}><BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 42 }}><XAxis type="number" domain={[0, 8]} /><YAxis type="category" dataKey="name" width={150} interval={0} tick={{ fontSize: 12 }} /><Tooltip content={<SpanishTooltip nameMap={{ score: 'Promedio regional' }} />} isAnimationActive={false} /><ReferenceLine x={average} stroke="var(--text-2)" strokeDasharray="5 4" label={{ value: `Promedio global ${average?.toFixed(2)}`, position: 'top', fill: 'var(--text-2)', fontSize: 12 }} /><Bar dataKey="score" name="Promedio regional" isAnimationActive={false} radius={[0, 4, 4, 0]} shape={(props) => { const {x,y,width,height,payload} = props; return <rect x={x} y={y} width={width} height={height} rx={4} fill={payload.score >= average ? 'var(--amber)' : 'var(--cobalt)'}/> }}><LabelList dataKey="score" position="right" formatter={(value) => Number(value).toFixed(2)} /></Bar></BarChart></ResponsiveContainer>
}

export function ScatterPanel({ records, year, countryKey }) {
  if (year === 2016) return <div className="not-comparable"><strong>N/D</strong><p>PIB 2016 no confiable · ver Datos y notas</p></div>
  const chartData = records.filter((row) => Number.isFinite(row.gdp_valid) && Number.isFinite(row.score))
  if (!chartData.length) return <div className="not-comparable"><strong>N/D</strong><p>No hay datos comparables.</p></div>
  const mx = chartData.reduce((sum,row)=>sum+row.gdp_valid,0)/chartData.length
  const my = chartData.reduce((sum,row)=>sum+row.score,0)/chartData.length
  const cov = chartData.reduce((sum,row)=>sum+(row.gdp_valid-mx)*(row.score-my),0)
  const vx = chartData.reduce((sum,row)=>sum+(row.gdp_valid-mx)**2,0)
  const slope = vx ? cov/vx : 0
  const intercept = my-slope*mx
  const regression = [{ gdp_valid: 0, score: intercept }, { gdp_valid: 10, score: slope * 10 + intercept }]
  return <ResponsiveContainer width="100%" height={220}><ScatterChart margin={{ top: 10, right: 12, bottom: 18, left: 8 }}><CartesianGrid stroke="var(--border)" /><XAxis type="number" dataKey="gdp_valid" name="PIB per cápita" domain={[0,10]} ticks={[0,2.5,5,7.5,10]} label={{value:'Índice de PIB per cápita (0 a 10)',position:'insideBottom',offset:-12,fill:'var(--text-2)',fontSize:12}} /><YAxis type="number" dataKey="score" name="Puntaje" domain={[2,8]} ticks={[2,4,6,8]} label={{value:'Puntaje de felicidad',angle:-90,position:'insideLeft',fill:'var(--text-2)',fontSize:12}} /><Tooltip content={<ScatterSpanishTooltip dimensionName="PIB per cápita" dimensionKey="gdp_valid" />} cursor={{ strokeDasharray:'3 3' }} isAnimationActive={false} /><Scatter data={chartData.map(row=>({...row, fill:row.country_key===countryKey?'var(--cobalt)':'var(--amber)'}))} name="Puntaje" fill="var(--amber)" shape={(props)=>{const {cx,cy,payload}=props;return <circle cx={cx} cy={cy} r={payload.country_key===countryKey?6:3.5} fill={payload.country_key===countryKey?'var(--cobalt)':'var(--amber)'} opacity="0.8"/>}} isAnimationActive={false}/><Scatter data={regression} line={{stroke:'var(--text)',strokeWidth:2}} fill="transparent" shape={()=>null} isAnimationActive={false}/></ScatterChart></ResponsiveContainer>
}

export default function Panorama({ data, year, region, onSelectCountry, countryKey }) {
  const records = data.filter((row) => row.year === year && (region === 'Todas' || row.region === region))
  return <>
    <KpiCards data={data} year={year} region={region} />
    <div className="dashboard-grid panorama-grid">
      <section className="panel map-panel"><div className="panel-heading"><div><h2>Distribución geográfica del puntaje</h2><p>Escala fija 1.7–7.8 · {year}</p></div></div><MapChart records={records} year={year} onSelectCountry={onSelectCountry} /></section>
      <section className="panel"><div className="panel-heading"><div><h2>Evolución 2015-2024: media y mediana</h2><p>Media y mediana global · {year}</p></div></div><EvolutionChart data={data} region={region} yearSelected={year} /></section>
      <section className="panel"><div className="panel-heading"><h2>Top 10 / Bottom 10 ({year})</h2></div><HorizontalRanking records={records} year={year} type="top" /><HorizontalRanking records={records} year={year} type="bottom" /></section>
      <section className="panel"><div className="panel-heading"><h2>Promedio por región ({year})</h2></div><RegionAverage data={data} year={year} region={region} /></section>
      <section className="panel"><div className="panel-heading"><h2>PIB vs felicidad ({year})</h2></div><ScatterPanel records={records} year={year} /></section>
    </div>
  </>
}
