import { RefreshCw } from 'lucide-react'
import { VERSION_TYPES } from '../../../config/env.js'
import { cn } from '../../../utils/helpers.js'

export default function LoginTypeSelector({ value, onChange, disabled, status, error, onRetry }) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-gray-900 dark:text-slate-100">Select Login Type</label>
      </div>

      <div className="flex flex-wrap gap-4">
        {VERSION_TYPES.map(({ value: optionValue, label }) => (
          <label
            key={optionValue}
            className={cn(
              'group flex cursor-pointer items-center gap-2',
              disabled ? 'cursor-not-allowed opacity-60' : '',
            )}
          >
            <input
              type="radio"
              name="login-type"
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
              disabled={disabled}
              className={cn(
                'h-4 w-4 border-gray-300 focus:ring-offset-2',
                value === 'GEPL' ? 'text-[#F5B800] focus:ring-[#F5B800]' : 'text-red-600 focus:ring-red-600',
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                value === optionValue ? 'text-black dark:text-white' : 'text-gray-600 group-hover:text-black dark:text-slate-400 dark:group-hover:text-white dark:text-white',
              )}
            >
              {label}
            </span>
          </label>
        ))}
      </div>

      {status === 'error' && (
        <div className="mt-3 flex items-start justify-between gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 p-3">
          <p className="text-xs font-medium text-red-700">
            {error || 'Could not check the app version.'}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
