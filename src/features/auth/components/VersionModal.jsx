import { TriangleAlert } from 'lucide-react'
import { cn } from '../../../utils/helpers.js'

export default function VersionModal({ open, message, theme, onCancel, onUpdate }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <TriangleAlert className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-black dark:text-white">Update Required</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onUpdate}
            className={cn(
              'h-12 flex-1 rounded-xl text-sm font-semibold shadow-lg transition',
              theme.btn,
            )}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}
