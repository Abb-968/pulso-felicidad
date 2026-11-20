import { useEffect, useMemo, useState } from 'react'
import { countryEs } from '../utils/countryCatalog.js'
import { regionEs } from '../utils/i18n.js'

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
    <aside className="notes-panel"><h2>Notas metodológicas</h2>
      <ul><li><b>PIB 2016 no disponible:</b> los valores 2016 se excluyen de la correlación.</li><li><b>Corrupción armonizada:</b> 2015, 2020, 2021 y 2023 usan la escala comparada.</li><li><b>1,502 observaciones:</b> país–año entre 2015 y 2024.</li><li><b>Nombres unificados:</b> 165 países mediante `country_key`.</li><li><b>Ranking recalculado:</b> ordenado por puntaje dentro del año.</li></ul>
      <button type="button" className="download-button" onClick={download}>Descargar CSV ({filtered.length})</button>
    </aside>
    <section className="panel data-table-panel"><div className="panel-heading"><div><h2>Datos y notas</h2><p>{filtered.length} filas · página {page} de {pages}</p></div></div>
      <div className="table-scroll"><table><thead><tr><th>País</th><th>Región</th><th>Puntaje</th><th>Ranking</th><th>Año</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.country_key}-${row.year}`}><td>{countryEs(row.country)}</td><td>{regionEs(row.region)}</td><td>{row.score.toFixed(2)}</td><td>{row.rank_recalc}</td><td>{row.year}</td></tr>)}</tbody></table></div>
      <div className="pagination"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>{page} / {pages}</span><button type="button" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div>
    </section>
  </div>
}
