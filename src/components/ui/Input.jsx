import { forwardRef } from 'react'
import { cn } from '../../utils/helpers.js'

const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <label className="block space-y-1">
      {label ? <span className="block text-sm font-medium">{label}</span> : null}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
          error ? 'border-red-500' : '',
          className,
        )}
        {...props}
      />
      {error ? <span className="block text-sm text-red-600">{error}</span> : null}
    </label>
  )
})

export default Input
