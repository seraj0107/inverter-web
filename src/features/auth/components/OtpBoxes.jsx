import { useEffect, useRef } from 'react'
import { OTP_LENGTH } from '../constants.js'

export default function OtpBoxes({ value, onChange, error, disabled, theme }) {
  const refs = useRef([])
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] || '')

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  const handleChange = (index, nextValue) => {
    const clean = nextValue.replace(/\D/g, '')
    if (!clean) return

    const next = (value.slice(0, index) + clean).slice(0, OTP_LENGTH)
    onChange(next)
    refs.current[Math.min(next.length, OTP_LENGTH - 1)]?.focus()
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (digits[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1))
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index))
        refs.current[index - 1]?.focus()
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`OTP digit ${index + 1}`}
            maxLength={OTP_LENGTH}
            value={digit}
            disabled={disabled}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onFocus={(event) => event.target.select()}
            className={`h-12 min-w-0 flex-1 rounded-xl border bg-white dark:bg-slate-900 text-center text-lg font-bold text-black dark:text-white outline-none transition-all disabled:opacity-60 ${
              error ? 'border-red-500' : `${theme.line} ${theme.focusSelf}`
            }`}
          />
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}
