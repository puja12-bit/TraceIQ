import { FileBox, Filter, Search } from "lucide-react"

export default function Artifacts() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artifacts</h1>
          <p className="text-gray-500 text-sm">Repository for generated reports, diagrams, and documents.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="search"
            placeholder="Search artifacts..."
            className="w-full bg-white pl-8 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 border bg-white px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors">
          <Filter className="h-4 w-4 text-gray-500" />
          Filter
        </button>
      </div>

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 font-medium text-gray-500">Type</th>
              <th className="px-6 py-3 font-medium text-gray-500">Application</th>
              <th className="px-6 py-3 font-medium text-gray-500">Date Generated</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* Empty state for the table */}
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center">
                <FileBox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-medium">No artifacts found</p>
                <p className="text-gray-500 mt-1">Generated documents will appear here.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
