import { Plus, Search } from "lucide-react"

export default function Applications() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-gray-500 text-sm">Manage and monitor connected applications.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="search"
            placeholder="Search applications..."
            className="w-full bg-white pl-8 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 rounded-md border bg-white">
        <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Get started by adding your first application to begin tracing its intelligence and architecture.
          </p>
          <button className="mt-4 flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />
            Add Application
          </button>
        </div>
      </div>
    </div>
  )
}
