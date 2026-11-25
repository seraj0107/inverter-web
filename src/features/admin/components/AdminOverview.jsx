import DashboardCard from '../../dashboard/components/DashboardCard.jsx'

export default function AdminOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DashboardCard title="Clients" value="—" description="Registered clients" />
      <DashboardCard title="Inverters" value="—" description="Monitored inverters" />
    </div>
  )
}
