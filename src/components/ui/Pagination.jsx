export default function Pagination({ page = 1, totalPages = 1, onChange, disabled = false }) {
  if (totalPages <= 1) return null

  const buttonClasses =
    'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

  return (
    <nav className="flex items-center gap-2" aria-label="Pagination">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
        className={buttonClasses}
      >
        Previous
      </button>
      <span className="min-w-24 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={buttonClasses}
      >
        Next
      </button>
    </nav>
  )
}
