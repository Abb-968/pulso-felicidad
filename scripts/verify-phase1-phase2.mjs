import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  globalAverage,
  medianScore,
  medianIQR,
  topBottom,
  topBottomGap,
  improvementVs2015,
  improvedBar,
  pearsonCorrelation,
  pearsonSafe,
} from '../src/utils/metrics.js'

const data = JSON.parse(fs.readFileSync(new URL('../src/data/happiness.json', import.meta.url), 'utf8'))
assert.equal(data.length, 1502)
assert.ok(data.every((row) => 'hle_norm' in row && 'rank_source' in row))

for (const year of [2015, 2016, 2024]) {
  assert.ok(data.some((row) => row.year === year))
}

const avg2024 = globalAverage(data, 2024)
assert.ok(Math.abs(avg2024.value - 5.531) < 0.0005)
assert.ok(Math.abs(avg2024.delta - 0.15) < 0.005)

const median2024 = medianIQR(data, 2024)
assert.ok(Math.abs(median2024.median - 5.801) < 0.001)
assert.ok(Math.abs(median2024.delta2015 - 0.57) < 0.001)
assert.ok(Math.abs(median2024.IQR - 1.795) < 0.01)
assert.equal(medianScore(data, 2024).toFixed(3), '5.801')

const gap = topBottomGap(data, 2024)
assert.ok(Math.abs(gap - 4.21) < 0.005)
const rankings = topBottom(data, 2024, 10)
assert.deepEqual(rankings.top.slice(0, 3).map((row) => [row.country, Number(row.score.toFixed(2))]), [
  ['Finland', 7.74], ['Denmark', 7.58], ['Iceland', 7.53],
])
assert.equal(rankings.bottom[0].country, 'Afghanistan')
assert.ok(Math.abs(rankings.bottom[0].score - 1.72) < 0.005)

assert.equal(improvementVs2015(data, 2024).label, '59% (82 de 138)')
assert.deepEqual(improvedBar(data, 2024), { improved: 82, notImproved: 56 })
assert.ok(Math.abs(pearsonCorrelation(data, 2024, 'Todas', 'gdp_valid') - 0.7685) < 0.002)

const avg2015 = globalAverage(data, 2015)
assert.ok(Math.abs(avg2015.value - 5.376) < 0.001)
assert.equal(avg2015.delta, null)
const median2015 = medianIQR(data, 2015)
assert.ok(Math.abs(median2015.median - 5.230) < 0.001)
assert.equal(medianIQR(data, 2015).delta2015, null)
assert.equal(improvementVs2015(data, 2015).label, 'Año base')

const rows2016 = data.filter((row) => row.year === 2016)
assert.ok(rows2016.every((row) => row.gdp_valid === null))
assert.equal(pearsonCorrelation(data, 2016, 'Todas', 'gdp_valid'), null)

const small = pearsonSafe([1, 2, 3], [2, 3, 4])
assert.deepEqual(small, { r: 1, n: 3, reliable: false })

console.log(JSON.stringify({
  rows: data.length,
  '2024': {
    media: avg2024.value,
    mediana: median2024.median,
    IQR: medianIQR(data, 2024).IQR,
    brecha: gap,
    mejora: improvementVs2015(data, 2024).label,
    rPIB: pearsonCorrelation(data, 2024, 'Todas', 'gdp_valid'),
  },
  '2015': { media: avg2015.value, mediana: median2015.median, mejora: 'Año base' },
  '2016': { gdp_valid: 'null', correlacion: 'N/D' },
}, null, 2))
