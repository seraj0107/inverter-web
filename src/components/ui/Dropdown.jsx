export default function Dropdown({ label, options = [], className = '', ...props }) {
  return (
    <label className="block space-y-1">
      {label ? <span className="block text-sm font-medium">{label}</span> : null}
      <select
        className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
