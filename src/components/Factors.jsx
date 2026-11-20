import { useMemo, useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, BarChart, Bar, LabelList } from 'recharts'
import { pearsonCorrelation } from '../utils/metrics.js'
import { regionEs } from '../utils/i18n.js'
import SpanishTooltip, { ScatterSpanishTooltip } from './SpanishTooltip.jsx'

const dimensions = {
  gdp_valid: 'PIB per cápita', social: 'Apoyo social', hle: 'Esperanza de vida sana',
  freedom: 'Libertad', generosity: 'Generosidad', corruption: 'Corrupción percibida'
}
const regionColors = ['var(--amber)','var(--cobalt)','var(--yellow)','var(--text-2)','var(--amber)','var(--cobalt)','var(--yellow)','var(--text-2)','var(--amber)','var(--cobalt)']

export default function Factors({ data, year, region }) {
  const [dimension, setDimension] = useState('gdp_valid')
  const records = useMemo(() => data.filter((row) => row.year === year && (region === 'Todas' || row.region === region)), [data, year, region])
  const points = records.filter((row) => Number.isFinite(row.score) && Number.isFinite(row[dimension]))
  const correlation = pearsonCorrelation(data, year, region, dimension)
  const regions = [...new Set(records.map((row) => row.region))]
  const rByRegion = regions.map((name) => {
    const subset = data.filter((row) => row.year === year && row.region === name)
    const r = pearsonCorrelation(subset, year, 'Todas', dimension)
    return { name: regionEs(name), r: r?.toFixed(3) ?? 'N/D', count: subset.length }
  })
  const trend = []
  for (let y = 2015; y <= 2024; y++) {
    const r = pearsonCorrelation(data, y, region, dimension)
    trend.push({ year: y, r: r === null ? null : r })
  }

  if (year === 2016 && dimension === 'gdp_valid') {
    return <div className="empty-state"><h2>PIB no comparable en 2016</h2><p>Esta dimensión tiene valores N/D debido a la armonización del dataset.</p></div>
  }

  return <>
    <div className="dimension-tabs">
      {[['PIB', 'gdp_valid'], ['Social', 'social'], ['Vida', 'hle'], ['Libertad', 'freedom'], ['Generosidad', 'generosity'], ['Corrupción', 'corruption']].map(([label, key]) => (
        <button key={key} type="button" className={dimension === key ? 'active' : ''} onClick={() => setDimension(key)}>{label}</button>
      ))}
    </div>
    <div className="dashboard-grid factors-grid">
      <section className="panel scatter-panel">
        <div className="panel-heading"><div><h2>{dimensions[dimension]} vs felicidad</h2><p>Color por región · {year}</p></div></div>
        <ResponsiveContainer width="100%" height={330}>
          <ScatterChart margin={{ top: 10, right: 18, bottom: 15, left: 0 }}>
            <CartesianGrid stroke="#E2E8F0" /><XAxis type="number" dataKey={dimension} name={dimensions[dimension]} /><YAxis type="number" dataKey="score" name="Puntaje" domain={[0, 8]} /><Tooltip content={<ScatterSpanishTooltip dimensionName={dimensions[dimension]} dimensionKey={dimension} />} isAnimationActive={false} />
            {regions.map((name, index) => <Scatter key={name} name={regionEs(name)} data={points.filter((row) => row.region === name)} fill={regionColors[index % regionColors.length]} />)}
          </ScatterChart>
        </ResponsiveContainer>
      </section>
      <section className="panel correlation-panel"><div className="panel-heading"><h2>Correlación Pearson</h2></div><strong className="correlation-big">{correlation === null ? 'N/D' : `r = ${correlation.toFixed(2)}`}</strong><p>{dimension === 'gdp_valid' ? 'PIB per cápita' : dimensions[dimension]}</p></section>
      <section className="panel"><div className="panel-heading"><h2>Resumen por región</h2></div><div className="table-scroll"><table><thead><tr><th>Región</th><th>r</th><th>Países</th></tr></thead><tbody>{rByRegion.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.r}</td><td>{row.count}</td></tr>)}</tbody></table></div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Evolución de r</h2><p>Relación con el puntaje de felicidad</p></div></div><ResponsiveContainer width="100%" height={220}><LineChart data={trend}><CartesianGrid stroke="#E2E8F0" /><XAxis dataKey="year" /><YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} /><Tooltip content={<SpanishTooltip labelPrefix="Año " nameMap={{ r: 'Correlación (r)' }} />} isAnimationActive={false} /><ReferenceLine y={0} stroke="#475569" /><Line type="monotone" dataKey="r" stroke="#D97706" strokeWidth={3} dot isAnimationActive={false}><LabelList dataKey="r" position="top" formatter={(value) => value === null ? 'N/D' : Number(value).toFixed(2)} /></Line></LineChart></ResponsiveContainer></section>
      <section className="panel"><div className="panel-heading"><h2>Peso estandarizado</h2></div><ResponsiveContainer width="100%" height={220}><BarChart data={[{name:'Apoyo social',weight:0.34},{name:'PIB per cápita',weight:0.26},{name:'Esperanza de vida',weight:0.24},{name:'Libertad',weight:0.22},{name:'Corrupción',weight:0.09},{name:'Generosidad',weight:0.05}].sort((a,b)=>b.weight-a.weight)} layout="vertical" margin={{left:15,right:38}}><CartesianGrid stroke="#E2E8F0"/><XAxis type="number" domain={[0,0.4]} ticks={[0,0.1,0.2,0.3,0.4]}/><YAxis type="category" dataKey="name" width={125} interval={0}/><Tooltip content={<SpanishTooltip nameMap={{ weight: 'Peso estandarizado' }} />} isAnimationActive={false}/><Bar dataKey="weight" name="Peso estandarizado" fill="#D97706" isAnimationActive={false}><LabelList dataKey="weight" position="right" formatter={(value)=>Number(value).toFixed(2)}/></Bar></BarChart></ResponsiveContainer></section>
    </div>
  </>
}
