export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
