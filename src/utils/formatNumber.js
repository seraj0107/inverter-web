export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || value === '') return ''

  const number = Number(value)
  if (Number.isNaN(number)) return ''

  return new Intl.NumberFormat(undefined, options).format(number)
}
