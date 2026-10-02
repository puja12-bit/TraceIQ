import { FolderTree, Search } from "lucide-react"

export default function KnowledgeExplorer() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Explorer</h1>
        <p className="text-gray-500 text-sm">Navigate through the application's knowledge base and entities.</p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Sidebar Tree */}
        <div className="w-64 border rounded-xl bg-white shadow-sm flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="search"
                placeholder="Filter entities..."
                className="w-full bg-gray-50 pl-8 pr-4 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center text-sm text-gray-500">
            Select an application to view tree
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 border rounded-xl bg-white shadow-sm flex items-center justify-center">
          <div className="text-center">
            <FolderTree className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Entity Selected</h3>
            <p className="text-sm text-gray-500 mt-1">Select an entity from the explorer to view details.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
