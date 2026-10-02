import { Activity, CreditCard, DollarSign, Users } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview of your application intelligence.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Applications", icon: Activity, value: "12", desc: "+2 from last month" },
          { title: "Knowledge Nodes", icon: Users, value: "2,350", desc: "+180 since last sync" },
          { title: "Queries Today", icon: CreditCard, value: "142", desc: "Active usage" },
          { title: "System Health", icon: DollarSign, value: "99.9%", desc: "All systems operational" },
        ].map((card, i) => (
          <div key={i} className="rounded-xl border bg-white text-gray-900 shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">{card.title}</h3>
              <card.icon className="h-4 w-4 text-gray-500" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-gray-500">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-white shadow-sm p-6 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Activity Overview</p>
            <p className="text-sm text-gray-500 mt-1">Loading chart data...</p>
          </div>
        </div>
        <div className="col-span-3 rounded-xl border bg-white shadow-sm p-6 flex items-center justify-center min-h-[300px]">
           <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Recent Queries</p>
            <p className="text-sm text-gray-500 mt-1">No recent queries found.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
