import { forwardRef } from 'react'
import { cn } from '../../../utils/helpers.js'

const StyledField = forwardRef(function StyledField(
  { id, label, icon: Icon, error, theme, rightSlot, className = '', ...props },
  ref,
) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-slate-100">
        {label}
      </label>
      <div
        className={cn(
          'flex h-12 items-center gap-3 rounded-xl border bg-white dark:bg-slate-900 px-3 transition-all',
          error ? 'border-red-500' : `${theme.line} ${theme.focus}`,
        )}
      >
        {Icon && <Icon size={18} className="text-gray-400 dark:text-slate-500" />}
        <input
          id={id}
          ref={ref}
          {...props}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-sm font-medium text-black dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500 disabled:opacity-60',
            className,
          )}
        />
        {rightSlot}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
})

export default StyledField
