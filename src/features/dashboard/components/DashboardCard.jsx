export default function DashboardCard({ title, value, description }) {
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-medium text-slate-500">{title}</h2>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </article>
  )
}
