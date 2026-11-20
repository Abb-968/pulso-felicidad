const formatterCache = new Map()

function getNumberFormatter(decimals = 2) {
  const key = Number(decimals)
  if (!formatterCache.has(key)) {
    formatterCache.set(key, new Intl.NumberFormat('en-US', {
      minimumFractionDigits: key,
      maximumFractionDigits: key,
    }))
  }
  return formatterCache.get(key)
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

export function fmtNum(value, decimals = 2) {
  if (!isFiniteNumber(value)) return 'N/D'
  return getNumberFormatter(decimals).format(value)
}

export function fmtSigned(value, decimals = 2) {
  if (!isFiniteNumber(value)) return 'N/D'
  const abs = fmtNum(Math.abs(value), decimals)
  return value < 0 ? `−${abs}` : `+${abs}`
}

export function fmtInt(value) {
  if (!isFiniteNumber(value)) return 'N/D'
  return getNumberFormatter(0).format(value)
}

export function fmtPct(value, decimals = 0) {
  if (!isFiniteNumber(value)) return 'N/D'
  return `${fmtNum(value, decimals)}%`
}
