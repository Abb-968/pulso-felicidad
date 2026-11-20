import { useEffect, useMemo, useState } from 'react'
import { countryEs } from '../utils/countryCatalog.js'
import { regionEs } from '../utils/i18n.js'
import { fmtInt, fmtNum } from '../utils/format.js'

export default function DataNotes({ data, year, region, search }) {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const filtered = useMemo(() => data.filter((row) => row.year === year && (region === 'Todas' || row.region === region) && (row.country.toLowerCase().includes(search.toLowerCase()) || countryEs(row.country).toLowerCase().includes(search.toLowerCase()))).sort((a, b) => a.rank_recalc - b.rank_recalc), [data, year, region, search])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  useEffect(() => setPage(1), [year, region, search])
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)

  const download = () => {
    const columns = ['year','country','country_key','region','rank_source','rank_recalc','score','gdp','gdp_valid','social','hle','hle_norm','freedom','generosity','corruption']
    const csv = [columns.join(','), ...filtered.map((row) => columns.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `happiness-${year}-${region}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <div className="data-layout">
    <aside className="notes-panel"><h2>Notas de calidad de los datos</h2>
      <ul className="quality-notes-list">
        <li className="quality-note-item amber"><b>PIB 2016 no disponible:</b> la media del indice en 2016 fue 9.69, frente al rango 5.0-6.4 del resto de los anos; se marca como N/D para evitar comparaciones invalidas.</li>
        <li className="quality-note-item amber"><b>Corrupcion percibida armonizada:</b> en 2015, 2020, 2021 y 2023 la escala venia invertida; se ajusto para que un valor mayor signifique menos corrupcion percibida.</li>
        <li className="quality-note-item amber"><b>Nombres de pais unificados:</b> se resolvieron 10 casos de nombres alternos y el catalogo final conserva 165 paises comparables.</li>
        <li className="quality-note-item blue"><b>Region fija por pais:</b> cada pais conserva la misma region en toda la serie para mantener comparaciones estables en el tiempo.</li>
        <li className="quality-note-item blue"><b>Esperanza de vida y apoyo social:</b> pueden cambiar de nivel entre ediciones del reporte; compara paises dentro del mismo ano.</li>
      </ul>

      <h3>Como leer los indicadores</h3>
      <ul className="quality-notes-list">
        <li className="quality-note-item blue"><b>Puntaje:</b> bienestar subjetivo en escala de 0 a 10.</li>
        <li className="quality-note-item blue"><b>Mediana:</b> el pais del medio de la lista ordenada por puntaje.</li>
        <li className="quality-note-item blue"><b>Brecha:</b> distancia entre el promedio de los 10 mas felices y el de los 10 menos felices.</li>
        <li className="quality-note-item blue"><b>r:</b> correlacion lineal donde 0 equivale a sin relacion y 1 a relacion total.</li>
      </ul>

      <button type="button" className="download-button" onClick={download}>Exportar CSV (año seleccionado)</button>
    </aside>
    <section className="panel data-table-panel"><div className="panel-heading"><div><h2>Detalle por país</h2><p>{fmtInt(filtered.length)} filas · página {fmtInt(page)} de {fmtInt(pages)}</p></div></div>
      <div className="table-scroll"><table><thead><tr><th>País</th><th>Región</th><th>Puntaje</th><th>Lugar</th><th>Año</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.country_key}-${row.year}`}><td>{countryEs(row.country)}</td><td>{regionEs(row.region)}</td><td>{fmtNum(row.score)}</td><td>{fmtInt(row.rank_recalc)}</td><td>{fmtInt(row.year)}</td></tr>)}</tbody></table></div>
      <div className="pagination"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>{fmtInt(page)} / {fmtInt(pages)}</span><button type="button" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div>
    </section>
  </div>
}
