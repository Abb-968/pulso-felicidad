export function filterByYearAndRegion(data, year, region = 'Todas') {
  return data.filter((record) => (
    record.year === Number(year)
    && (region === 'Todas' || region === 'All' || record.region === region)
  ))
}

function toFiniteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'))
    return Number.isFinite(normalized) ? normalized : null
  }
  return null
}

export function average(values) {
  const valid = values.map((value) => toFiniteNumber(value)).filter((value) => value !== null)
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

export function regionalRank(data, countryKey, year) {
  const country = data.find((record) => record.country_key === countryKey && record.year === Number(year))
  if (!country) return { rank: null, total: 0 }
  const sameRegion = data.filter((record) => record.year === Number(year) && record.region === country.region && Number.isFinite(record.score)).sort((a, b) => b.score - a.score)
  const rank = sameRegion.findIndex((record) => record.country_key === countryKey) + 1
  return { rank: rank || null, total: sameRegion.length }
}

export function percentileByDimension(data, countryKey, year) {
  const dimensions = ['score', 'gdp_valid', 'social', 'hle_norm', 'freedom', 'generosity', 'corruption']
  const country = data.find((record) => record.country_key === countryKey && record.year === Number(year))
  if (!country) return Object.fromEntries(dimensions.map((dimension) => [dimension, null]))
  return Object.fromEntries(dimensions.map((dimension) => {
    if (Number(year) === 2016 && dimension === 'gdp_valid') return [dimension, null]
    const values = data.filter((record) => record.year === Number(year) && Number.isFinite(record[dimension])).map((record) => record[dimension])
    if (!Number.isFinite(country[dimension]) || !values.length) return [dimension, null]
    let lower = 0
    let equal = 0
    values.forEach((value) => { if (value < country[dimension]) lower += 1; if (value === country[dimension]) equal += 1 })
    return [dimension, ((lower + 0.5 * equal) / values.length) * 100]
  }))
}

export function topBottom(data, year, n = 10) {
  const records = data.filter((record) => record.year === Number(year) && Number.isFinite(record.score)).sort((a, b) => b.score - a.score)
  return { top: records.slice(0, n), bottom: [...records].sort((a, b) => a.score - b.score).slice(0, n) }
}

function percentile(values, probability) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const position = (sorted.length - 1) * probability
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

export function medianIQR(data, year) {
  const scores = data.filter((record) => record.year === Number(year) && Number.isFinite(record.score)).map((record) => record.score)
  const baseScores = data.filter((record) => record.year === 2015 && Number.isFinite(record.score)).map((record) => record.score)
  const median = percentile(scores, 0.5)
  const q1 = percentile(scores, 0.25)
  const q3 = percentile(scores, 0.75)
  const baseMedian = percentile(baseScores, 0.5)
  return { median, q1, q3, IQR: q1 === null || q3 === null ? null : q3 - q1, delta2015: Number(year) === 2015 || median === null || baseMedian === null ? null : median - baseMedian }
}

export function improvedBar(data, year) {
  if (Number(year) === 2015) return { improved: 0, notImproved: 0 }
  const baseline = new Map(data.filter((record) => record.year === 2015 && Number.isFinite(record.score)).map((record) => [record.country_key, record.score]))
  const paired = data.filter((record) => record.year === Number(year) && Number.isFinite(record.score) && baseline.has(record.country_key))
  const improved = paired.filter((record) => record.score > baseline.get(record.country_key)).length
  return { improved, notImproved: paired.length - improved }
}

export function pearsonSafe(x, y) {
  const pairs = x.map((value, index) => [value, y[index]]).filter(([first, second]) => Number.isFinite(first) && Number.isFinite(second))
  const n = pairs.length
  if (!n) return { r: null, n: 0, reliable: false }
  const meanX = pairs.reduce((sum, [first]) => sum + first, 0) / n
  const meanY = pairs.reduce((sum, [, second]) => sum + second, 0) / n
  let covariance = 0
  let varianceX = 0
  let varianceY = 0
  pairs.forEach(([first, second]) => { covariance += (first - meanX) * (second - meanY); varianceX += (first - meanX) ** 2; varianceY += (second - meanY) ** 2 })
  const denominator = Math.sqrt(varianceX * varianceY)
  return { r: denominator === 0 ? null : covariance / denominator, n, reliable: n >= 8 }
}
