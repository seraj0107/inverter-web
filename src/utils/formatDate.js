export const num = (value) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const fmt = (value, digits = 1) => {
  const parsed = num(value)
  return parsed === null ? '--' : parsed.toFixed(digits)
}

export const arr = (value) => (Array.isArray(value) ? value : [])

export const nums = (values) =>
  arr(values)
    .map((value) => num(value))
    .filter((value) => value !== null)

export const onTime = (value) =>
  typeof value === 'string' && value.includes(':') ? value : `${fmt(value, 1)} hrs`

export const isOffline = (plant) =>
  String(plant?.plantState ?? '').trim().toUpperCase() === 'OFFLINE'

export const pct = (current, previous) => {
  const next = num(current)
  const prior = num(previous)
  if (next === null || prior === null || prior === 0) return null
  return ((next - prior) / prior) * 100
}

export const axis = (value) => num(value) ?? 0

export const fmtDate = (value) => {
  if (!value) return '--'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const fmtTime = (value) => {
  if (!value) return '--'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
