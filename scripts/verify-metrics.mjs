import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  globalAverage,
  medianScore,
  topBottomGap,
  improvementVs2015,
  pearsonCorrelation,
  regionalRank,
  topBottom,
  medianIQR,
  improvedBar,
  pearsonSafe,
} from '../src/utils/metrics.js'

const data = JSON.parse(fs.readFileSync(new URL('../src/data/happiness.json', import.meta.url), 'utf8'))

const average = globalAverage(data, 2024)
assert.ok(Math.abs(average.value - 5.53) < 0.005)
assert.ok(Math.abs(average.delta - 0.15) < 0.005)
assert.ok(Math.abs(medianScore(data, 2024) - 5.80) < 0.005)
assert.ok(Math.abs(topBottomGap(data, 2024) - 4.21) < 0.005)
assert.equal(improvementVs2015(data, 2024).label, '59% (82 de 138)')
assert.ok(Math.abs(pearsonCorrelation(data, 2024, 'Todas', 'gdp_valid') - 0.77) < 0.005)

assert.deepEqual(regionalRank(data, 'canada', 2024), { rank: 3, total: 4 })

const rankings = topBottom(data, 2024, 10)
assert.deepEqual(rankings.top.slice(0, 5).map((row) => row.country), ['Finland', 'Denmark', 'Iceland', 'Sweden', 'Israel'])
assert.deepEqual(rankings.bottom.slice(0, 5).map((row) => row.country), ['Afghanistan', 'Lebanon', 'Lesotho', 'Sierra Leone', 'Congo (Kinshasa)'])

const iqr = medianIQR(data, 2024)
assert.ok(Math.abs(iqr.delta2015 - 0.57) < 0.005)
assert.deepEqual(improvedBar(data, 2024), { improved: 82, notImproved: 56 })

const safe = pearsonSafe([1, 2, 3], [2, 3, 4])
assert.equal(safe.n, 3)
assert.equal(safe.reliable, false)

const zeroGDP = data.filter((row) => row.year === 2024 && row.gdp_valid === 0)
console.log('Venezuela:', zeroGDP.map((row) => `${row.country}: score=${row.score}, gdp_valid=${row.gdp_valid}`).join(', ') || 'ninguno')
console.log('Verificación de métricas 2024: OK')
