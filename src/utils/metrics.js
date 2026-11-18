export function filterByYearAndRegion(data, year, region = 'Todas') {
  return data.filter((record) => (
    record.year === Number(year)
    && (region === 'Todas' || region === 'All' || record.region === region)
  ))
}

export function average(values) {
  const valid = values.filter((value) => Number.isFinite(value))
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null
}

export function globalAverage(data, year, region = 'Todas') {
  const current = filterByYearAndRegion(data, year, region)
  const value = average(current.map((record) => record.score))

  if (Number(year) === 2015) {
    return { value, delta: null }
  }

  const baseline = filterByYearAndRegion(data, 2015, region)
  const baselineValue = average(baseline.map((record) => record.score))
  return { value, delta: value === null || baselineValue === null ? null : value - baselineValue }
}

export function improvementVs2015(data, year, region = 'Todas') {
  if (Number(year) === 2015) {
    return { percentage: null, count: null, total: null, label: 'Año base' }
  }

  const current = filterByYearAndRegion(data, year, region)
  const baseline = filterByYearAndRegion(data, 2015, region)
  const baselineByCountry = new Map(baseline.map((record) => [record.country_key, record.score]))
  const paired = current.filter((record) => (
    baselineByCountry.has(record.country_key)
    && Number.isFinite(record.score)
    && Number.isFinite(baselineByCountry.get(record.country_key))
  ))
  const improvedCount = paired.filter((record) => record.score > baselineByCountry.get(record.country_key)).length
  const total = paired.length
  const percentage = total ? Math.round((improvedCount / total) * 100) : null

  return { percentage, count: improvedCount, total, label: `${percentage ?? 0}% (${improvedCount} de ${total})` }
}

export function medianScore(data, year, region = 'Todas') {
  const values = filterByYearAndRegion(data, year, region)
    .map((record) => record.score)
    .filter(Number.isFinite)
    .sort((a, b) => a - b)

  if (!values.length) return null
  const middle = Math.floor(values.length / 2)
  return values.length % 2
    ? values[middle]
    : (values[middle - 1] + values[middle]) / 2
}

export function topBottomGap(data, year, region = 'Todas') {
  const scores = filterByYearAndRegion(data, year, region)
    .map((record) => record.score)
    .filter(Number.isFinite)
    .sort((a, b) => b - a)

  if (scores.length < 20) return null
  const topAverage = average(scores.slice(0, 10))
  const bottomAverage = average(scores.slice(-10))
  return topAverage - bottomAverage
}

export function pearsonCorrelation(data, year, region = 'Todas', dimension = 'gdp_valid') {
  if (Number(year) === 2016 && dimension === 'gdp_valid') return null

  const pairs = filterByYearAndRegion(data, year, region)
    .filter((record) => Number.isFinite(record.score) && Number.isFinite(record[dimension]))
    .map((record) => [record.score, record[dimension]])

  if (pairs.length < 2) return null
  const meanX = average(pairs.map(([x]) => x))
  const meanY = average(pairs.map(([, y]) => y))
  let covariance = 0
  let varianceX = 0
  let varianceY = 0

  pairs.forEach(([x, y]) => {
    const dx = x - meanX
    const dy = y - meanY
    covariance += dx * dy
    varianceX += dx * dx
    varianceY += dy * dy
  })

  const denominator = Math.sqrt(varianceX * varianceY)
  return denominator === 0 ? null : covariance / denominator
}

export function calculateKpis(data, year, region = 'Todas') {
  return {
    average: globalAverage(data, year, region),
    median: medianScore(data, year, region),
    topBottomGap: topBottomGap(data, year, region),
    improvement: improvementVs2015(data, year, region),
  }
}
