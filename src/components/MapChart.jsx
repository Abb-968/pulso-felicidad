import { useMemo, useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import { countryEs } from '../utils/countryCatalog.js'
import { regionEs } from '../utils/i18n.js'

const classes = ['#FEF3C7', '#FDE68A', '#FCD34D', '#F59E0B', '#D97706', '#B45309']

const mapAliases = {
  united_states_of_america: 'united_states_of_america',
  united_states: 'united_states_of_america',
  russia: 'russia',
  russian_federation: 'russia',
  republic_of_korea: 'south_korea',
  democratic_peoples_republic_of_korea: 'north_korea',
  vietnam: 'viet_nam',
  iran: 'iran_islamic_republic_of',
  tanzania: 'united_republic_of_tanzania',
  congo_kinshasa: 'democratic_republic_of_the_congo',
  democratic_republic_of_congo: 'democratic_republic_of_the_congo',
  congo_brazzaville: 'republic_of_the_congo',
  ivory_coast: 'cote_d_ivoire',
  swaziland: 'eswatini',
  dominican_republic: 'dominican_rep',
  czech_republic: 'czechia',
  turkey: 'turkiye',
  dem_rep_congo: 'democratic_republic_of_the_congo',
  congo: 'republic_of_the_congo',
  palestine: 'palestinian_territories',
  bosnia_and_herz: 'bosnia_and_herzegovina',
  macedonia: 'north_macedonia',
  central_african_rep: 'central_african_republic',
  dominican_rep: 'dominican_republic',
  cote_d_ivoire: 'ivory_coast',
  c_te_d_ivoire: 'ivory_coast',
}

function nameKey(name) {
  if (!name) return ''
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]+/g, '_')
    .replace(/^_|_$/g, '')
  return mapAliases[normalized] ?? normalized
}

export default function MapChart({ records, year, onSelectCountry }) {
  const [hover, setHover] = useState(null)
  const countries = useMemo(() => feature(world, world.objects.countries).features, [])
  const byName = useMemo(() => new Map(records.map((record) => [nameKey(record.country), record])), [records])
  const projection = geoNaturalEarth1().fitSize([760, 300], { type: 'Sphere' })
  const path = geoPath(projection)

  const colorFor = (score) => {
    if (!Number.isFinite(score)) return '#CBD5E1'
    const index = Math.min(5, Math.max(0, Math.floor((Math.max(1.7, Math.min(7.8, score)) - 1.7) / ((7.8 - 1.7) / 6))))
    return classes[index]
  }

  return (
    <div className="map-wrap">
      <svg viewBox="0 0 760 300" role="img" aria-label="Mapa coroplético mundial">
        <path d={path({ type: 'Sphere' })} className="map-sphere" />
        {countries.filter((country) => country.properties.name !== 'Antarctica').map((country, index) => {
          const record = byName.get(nameKey(country.properties.name))
          const countryName = record ? countryEs(record.country) : countryEs(country.properties.name)
          return (
            <path
              key={String(country.id ?? country.properties.name ?? index)}
              d={path(country)}
              fill={colorFor(record?.score)}
              stroke="#FFFFFF"
              strokeWidth="0.45"
              className="map-country"
              onMouseEnter={(event) => {
                setHover({
                  x: event.nativeEvent.offsetX,
                  y: event.nativeEvent.offsetY,
                  record,
                  countryName,
                  noData: !record,
                })
              }}
              onMouseMove={(event) => setHover({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY, record, countryName, noData: !record })}
              onMouseLeave={() => setHover(null)}
              onClick={() => record && onSelectCountry(record.country_key)}
            />
          )
        })}
      </svg>
      {hover && (
        <div
          className="map-tooltip"
          style={{
            left: `${hover.x}px`,
            top: `${hover.y}px`,
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
          <strong>{hover.countryName}</strong>
          {hover.noData ? <span>Sin datos para este año</span> : (
            <>
              <span>Puntaje {hover.record.score.toFixed(2)}</span>
              <span>Lugar {hover.record.rank_recalc} de {records.length}</span>
            </>
          )}
        </div>
      )}
      <div className="map-legend">
        <div><span>1.7</span><div>{classes.map((color) => <i key={color} style={{ background: color }} />)}</div><span>7.8</span></div>
        <span className="no-data"><i /> Sin datos</span>
      </div>
    </div>
  )
}
