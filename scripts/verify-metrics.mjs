import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  globalAverage,
  medianScore,
  topBottomGap,
  improvementVs2015,
  pearsonCorrelation,
  medianIQR,
} from '../src/utils/metrics.js'

const data = JSON.parse(fs.readFileSync(new URL('../src/data/happiness.json', import.meta.url), 'utf8'))
const approx = (actual, expected, tolerance = 0.005) => Math.abs(actual - expected) <= tolerance

const average = globalAverage(data, 2024)
const median = medianScore(data, 2024)
const iqr = medianIQR(data, 2024)
const gap = topBottomGap(data, 2024)
const improvement = improvementVs2015(data, 2024)
const rGdp2024 = pearsonCorrelation(data, 2024, 'Todas', 'gdp_valid')
const rGdp2016 = pearsonCorrelation(data, 2016, 'Todas', 'gdp_valid')

const rows2024 = data.filter((row) => row.year === 2024 && Number.isFinite(row.score))
const sorted2024 = [...rows2024].sort((a, b) => b.score - a.score)
const mexico2024 = sorted2024.find((row) => row.country_key === 'mexico')
const mexicoRank2024 = sorted2024.findIndex((row) => row.country_key === 'mexico') + 1

assert.ok(approx(average.value, 5.53), `Media 2024 esperada 5.53, recibida ${average.value}`)
assert.ok(approx(median, 5.80), `Mediana 2024 esperada 5.80, recibida ${median}`)
assert.ok(approx(iqr.IQR, 1.79), `IQR 2024 esperado 1.79, recibido ${iqr.IQR}`)
assert.ok(approx(gap, 4.21), `Brecha 2024 esperada 4.21, recibida ${gap}`)
assert.equal(improvement.count, 82, `Países mejorados esperados 82, recibido ${improvement.count}`)
assert.equal(improvement.total, 138, `Total comparables esperado 138, recibido ${improvement.total}`)
assert.ok(approx(rGdp2024, 0.77), `r PIB 2024 esperado 0.77, recibido ${rGdp2024}`)
assert.ok(mexico2024, 'No se encontró México en 2024')
assert.ok(approx(mexico2024.score, 6.68), `Puntaje México 2024 esperado 6.68, recibido ${mexico2024.score}`)
assert.equal(mexicoRank2024, 25, `Lugar México 2024 esperado 25, recibido ${mexicoRank2024}`)
assert.equal(rGdp2016, null, `r PIB 2016 esperado N/D (null), recibido ${rGdp2016}`)

console.log('Verificación de métricas 2024: OK')
console.log(`Media global: ${average.value.toFixed(2)}`)
console.log(`Mediana global: ${median.toFixed(2)}`)
console.log(`Rango intercuartil: ${iqr.IQR.toFixed(2)}`)
console.log(`Brecha top-bottom: ${gap.toFixed(2)}`)
console.log(`Mejoraron vs 2015: ${improvement.count} de ${improvement.total}`)
console.log(`r PIB 2024: ${rGdp2024.toFixed(2)}`)
console.log(`México 2024: ${mexico2024.score.toFixed(2)} (lugar ${mexicoRank2024})`)
console.log('r PIB 2016: N/D')
