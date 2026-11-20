import { useMemo, useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, LabelList, ErrorBar, Cell, ReferenceLine, ReferenceDot } from 'recharts'
import { pearsonCorrelation } from '../utils/metrics.js'
import { fmtNum } from '../utils/format.js'
import SpanishTooltip, { ScatterSpanishTooltip } from './SpanishTooltip.jsx'
import MapChart from './MapChart.jsx'

const dimensions = {
  gdp_valid: 'PIB per cápita', social: 'Apoyo social', hle: 'Esperanza de vida sana',
  freedom: 'Libertad', generosity: 'Generosidad', corruption: 'Corrupción (menos percibida)'
}

const weightsData = [
  { key: 'social', name: 'Apoyo social', weight: 0.344, ciLow: 0.296, ciHigh: 0.393 },
  { key: 'gdp_valid', name: 'PIB per cápita', weight: 0.260, ciLow: 0.201, ciHigh: 0.319 },
  { key: 'hle', name: 'Esperanza de vida sana', weight: 0.238, ciLow: 0.177, ciHigh: 0.299 },
  { key: 'freedom', name: 'Libertad', weight: 0.217, ciLow: 0.185, ciHigh: 0.249 },
  { key: 'corruption', name: 'Corrupción (menos percibida)', weight: 0.087, ciLow: 0.053, ciHigh: 0.122 },
  { key: 'generosity', name: 'Generosidad', weight: 0.048, ciLow: 0.017, ciHigh: 0.078 },
].map((row) => ({ ...row, ciError: [row.weight - row.ciLow, row.ciHigh - row.weight] }))

function CorrelationTrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (point?.note) {
    return (
      <div className="recharts-es-tooltip" style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(15,23,42,0.08)', color: '#1E293B' }}>
        <strong>Año {label}</strong>
        <span>{point.note}</span>
      </div>
    )
  }

  return <SpanishTooltip active={active} payload={payload} label={label} labelPrefix="Año " nameMap={{ r: 'Correlación (r)' }} />
}

function NdBadge({ viewBox, x, y }) {
  const cx = viewBox?.x ?? x ?? 0
  const cy = viewBox?.y ?? y ?? 0
  const width = 34
  const height = 18
  const rx = 6
  return (
    <g>
      <rect x={cx - width / 2} y={cy - height / 2} width={width} height={height} rx={rx} fill="#FFFFFF" stroke="#1E293B" strokeWidth="1" />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#1E293B" fontSize={11} fontWeight={700}>N/D</text>
    </g>
  )
}

export default function Factors({ data, year, region, countryKey, onOpenDataNotes }) {
  const [dimension, setDimension] = useState('gdp_valid')
  const records = useMemo(() => data.filter((row) => row.year === year && (region === 'Todas' || row.region === region)), [data, year, region])
  const gdpNotComparable = dimension === 'gdp_valid' && year === 2016
  const points = records.filter((row) => Number.isFinite(row.score) && Number.isFinite(row[dimension]) && !gdpNotComparable)
  const correlation = pearsonCorrelation(data, year, region, dimension)
  const correlationLabel = correlation === null ? 'N/D' : fmtNum(correlation)
  const trend = []
  for (let y = 2015; y <= 2024; y++) {
    const r = pearsonCorrelation(data, y, region, dimension)
    trend.push({
      year: y,
      r: (dimension === 'gdp_valid' && y === 2016) || r === null ? null : r,
      note: dimension === 'gdp_valid' && y === 2016 ? 'PIB 2016 no confiable en la fuente' : null,
    })
  }
  const yearTicks = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
  const mapRangeByDimension = useMemo(() => {
    const keys = ['gdp_valid', 'social', 'hle', 'freedom', 'generosity', 'corruption']
    return Object.fromEntries(keys.map((key) => {
      const values = data
        .filter((row) => Number.isFinite(row[key]) && !(key === 'gdp_valid' && row.year === 2016))
        .map((row) => row[key])
      if (!values.length) return [key, [0, 1]]
      return [key, [Math.min(...values), Math.max(...values)]]
    }))
  }, [data])
  const mapRange = mapRangeByDimension[dimension] ?? [0, 1]
  const xDomain = (() => {
    if (dimension === 'gdp_valid') return [0, 10]
    if (dimension === 'hle') {
      const values = points.map((point) => point.hle).filter(Number.isFinite)
      if (!values.length) return [0, 1]
      return [Math.min(...values), Math.max(...values)]
    }
    return [0, 1]
  })()
  const regression = (() => {
    if (points.length < 2) return []
    const meanX = points.reduce((sum, point) => sum + point[dimension], 0) / points.length
    const meanY = points.reduce((sum, point) => sum + point.score, 0) / points.length
    const covariance = points.reduce((sum, point) => sum + (point[dimension] - meanX) * (point.score - meanY), 0)
    const varianceX = points.reduce((sum, point) => sum + (point[dimension] - meanX) ** 2, 0)
    if (!varianceX) return []
    const slope = covariance / varianceX
    const intercept = meanY - slope * meanX
    return [
      { [dimension]: xDomain[0], score: slope * xDomain[0] + intercept },
      { [dimension]: xDomain[1], score: slope * xDomain[1] + intercept },
    ]
  })()
  const showComparabilityNotice = dimension === 'hle' || dimension === 'social'
  const highlightedWeight = weightsData.find((item) => item.key === dimension)
  const sortedWeights = [...weightsData].sort((a, b) => b.weight - a.weight)

  return <>
    <div className="dimension-tabs">
      {[['PIB per cápita', 'gdp_valid'], ['Apoyo social', 'social'], ['Esperanza de vida sana', 'hle'], ['Libertad', 'freedom'], ['Generosidad', 'generosity'], ['Corrupción (menos percibida)', 'corruption']].map(([label, key]) => (
        <button key={key} type="button" className={dimension === key ? 'active' : ''} onClick={() => setDimension(key)}>{label}</button>
      ))}
    </div>
    <div className="dashboard-grid factors-grid">
      <section className="panel factor-map-panel" aria-label={`Mapa de ${dimensions[dimension]} para ${year}`}>
        <div className="panel-heading"><div><h2>Mapa: {dimensions[dimension]} ({year})</h2><p>{gdpNotComparable ? 'N/D para esta edición del PIB' : 'Escala fija para todos los años'}</p></div></div>
        <MapChart
          records={records}
          year={year}
          valueKey={dimension}
          valueRange={mapRange}
          legendMinLabel="Menor valor"
          legendMaxLabel="Mayor valor"
          tooltipMetricLabel={dimensions[dimension]}
          tooltipMode="factor"
          forceNoData={gdpNotComparable}
        />
        {gdpNotComparable && <p className="comparability-note">PIB 2016 no confiable en la fuente: el mapa se muestra como N/D.</p>}
      </section>
      <section className="panel scatter-panel" aria-label={`Dispersión entre ${dimensions[dimension]} y puntaje de felicidad para ${year}. Correlación ${correlationLabel}`}>
        <div className="panel-heading"><div><h2>{dimensions[dimension]} vs felicidad</h2><p>{year}</p></div><span className="r-chip">r = {correlationLabel}</span></div>
        {showComparabilityNotice && <p className="comparability-note">Los niveles de esta variable cambian entre ediciones: compara países dentro del mismo año.</p>}
        {gdpNotComparable ? <div className="not-comparable"><strong>N/D</strong><p>Sin datos de PIB para 2016. Elige otro año u otra dimensión.</p><button type="button" onClick={onOpenDataNotes}>Ver notas</button></div> : <ResponsiveContainer width="100%" height={330}>
          <ScatterChart accessibilityLayer margin={{ top: 10, right: 18, bottom: 15, left: 10 }}>
            <CartesianGrid stroke="#E2E8F0" /><XAxis type="number" dataKey={dimension} name={dimensions[dimension]} domain={xDomain} /><YAxis type="number" dataKey="score" name="Puntaje" domain={[2, 8]} ticks={[2, 4, 6, 8]} /><Tooltip content={<ScatterSpanishTooltip dimensionName={dimensions[dimension]} dimensionKey={dimension} />} isAnimationActive={false} />
            <Scatter data={points} name="Puntaje" fill="var(--amber)" isAnimationActive={false} shape={(props) => {
              const { cx, cy, payload } = props
              const selected = payload.country_key === countryKey
              return <circle cx={cx} cy={cy} r={selected ? 6 : 3.5} fill={selected ? 'var(--cobalt)' : 'var(--amber)'} opacity="0.82" />
            }} />
            <Scatter data={regression} line={{ stroke: 'var(--text)', strokeWidth: 2 }} fill="transparent" shape={() => null} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>}
      </section>
      <section className="panel" aria-label={`Evolución anual de la correlación entre ${dimensions[dimension]} y felicidad`}><div className="panel-heading"><div><h2>Evolución de r</h2><p>Relación con el puntaje de felicidad</p></div></div><ResponsiveContainer width="100%" height={220}><LineChart accessibilityLayer data={trend} margin={{ top: 14, right: 12, bottom: 8, left: 2 }}><CartesianGrid stroke="#E2E8F0" /><XAxis type="number" dataKey="year" domain={[2015, 2024]} ticks={yearTicks} allowDecimals={false} /><YAxis domain={[0.6, 0.9]} ticks={[0.6, 0.7, 0.8, 0.9]} /><Tooltip content={<CorrelationTrendTooltip />} isAnimationActive={false} />{dimension === 'gdp_valid' && <ReferenceLine x={2016} stroke="var(--text-2)" strokeDasharray="4 4" />}{dimension === 'gdp_valid' && <ReferenceDot x={2016} y={0.85} r={0} isFront label={<NdBadge />} />}<Line type="monotone" dataKey="r" stroke="#D97706" strokeWidth={3} connectNulls={false} dot={{ r: 3.5, fill: '#D97706' }} isAnimationActive={false}><LabelList dataKey="r" position="top" formatter={(value, index) => (value !== null && (index === 0 || index === trend.length - 1) ? fmtNum(value) : '')} /></Line></LineChart></ResponsiveContainer></section>
      <section className="panel" aria-label={`Peso estandarizado e intervalos de confianza para ${dimensions[dimension]}`}><div className="panel-heading"><div><h2>Peso estandarizado</h2><p>{highlightedWeight ? `Dimensión seleccionada: ${highlightedWeight.name}` : 'Coeficiente con IC 95%'}</p></div></div><ResponsiveContainer width="100%" height={240}><BarChart accessibilityLayer data={sortedWeights} layout="vertical" margin={{left:15,right:38}}><CartesianGrid stroke="#E2E8F0"/><XAxis type="number" domain={[0,0.42]} ticks={[0,0.1,0.2,0.3,0.4]}/><YAxis type="category" dataKey="name" width={180} interval={0} tick={{ fontSize: 12 }} /><Tooltip content={<SpanishTooltip nameMap={{ weight: 'Coeficiente', ciLow: 'IC 95% inferior', ciHigh: 'IC 95% superior' }} />} isAnimationActive={false}/><Bar dataKey="weight" name="Coeficiente" isAnimationActive={false}><ErrorBar dataKey="ciError" width={4} strokeWidth={1.5} stroke="var(--text)" /><LabelList dataKey="weight" content={(props) => {
              const { x, y, width, height, payload, value } = props
              if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height) || !payload || !Number.isFinite(value) || !Number.isFinite(payload.ciHigh) || !Number.isFinite(payload.weight) || payload.weight === 0) {
                return null
              }
              const ciHighX = x + (payload.ciHigh * width) / payload.weight
              return <text x={ciHighX + 8} y={y + (height / 2) + 4} fill="var(--text)" fontSize={12}>{fmtNum(value, 2)}</text>
            }} />{sortedWeights.map((row) => <Cell key={row.key} fill={row.key === dimension ? 'var(--cobalt)' : 'var(--amber)'} />)}</Bar></BarChart></ResponsiveContainer></section>
      <section className="panel quality-note-panel"><div className="panel-heading"><h2>Nota de calidad</h2></div><p>PIB 2016: la fuente trae valores inconsistentes (media 9.69 frente a 5.0-6.4 en otros años). Se excluye y se muestra como N/D.</p><button type="button" className="quality-note-button" onClick={onOpenDataNotes}>Ver notas</button></section>
    </div>
  </>
}
