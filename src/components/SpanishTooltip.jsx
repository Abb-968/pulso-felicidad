import { countryEs } from '../utils/countryCatalog.js'

export function ScatterSpanishTooltip({ active, payload, dimensionName, dimensionKey }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  const dimensionValue = dimensionKey ? point[dimensionKey] : payload[0]?.value
  const score = point.score

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
        color: '#1E293B',
      }}
    >
      <strong>{countryEs(point.country)}</strong>
      <span>{dimensionName}: {typeof dimensionValue === 'number' ? dimensionValue.toFixed(2) : 'N/D'}</span>
      <span>Puntaje de felicidad: {typeof score === 'number' ? score.toFixed(2) : 'N/D'}</span>
    </div>
  )
}

export default function SpanishTooltip({ active, payload, label, nameMap = {}, labelPrefix = '' }) {
  if (!active || !payload?.length) return null

  const rows = payload
    .filter((entry) => {
      const key = entry.dataKey ?? entry.name
      return nameMap[key] || nameMap[entry.name]
    })
    .map((entry) => {
      const key = entry.dataKey ?? entry.name
      const name = nameMap[key] || nameMap[entry.name] || entry.name
      const value = typeof entry.value === 'number' ? entry.value : null
      return { name, value }
    })

  if (!rows.length) return null

  return (
    <div
      className="recharts-es-tooltip"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
        color: '#1E293B',
      }}
    >
      {label !== undefined && label !== null && <strong>{labelPrefix}{label}</strong>}
      {rows.map((row) => (
        <span key={row.name}>{row.name}: {row.value === null ? 'N/D' : row.value.toFixed(2)}</span>
      ))}
    </div>
  )
}
