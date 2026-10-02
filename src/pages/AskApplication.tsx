import { Search, Sparkles, SlidersHorizontal } from "lucide-react"

export default function AskApplication() {
  return (
    <div className="flex flex-col gap-6 h-full max-w-4xl mx-auto w-full">
      <div className="text-center mt-12 mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
          <Sparkles className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Ask Application</h1>
        <p className="text-gray-500 mt-2">Query your architecture, dependencies, and business logic.</p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Search className="h-5 w-5 text-gray-400 ml-2" />
          <input 
            type="text" 
            placeholder="e.g. How does the payment processing flow work?" 
            className="flex-1 text-base focus:outline-none py-2"
          />
          <div className="h-6 w-px bg-gray-200"></div>
          <button className="text-gray-500 hover:text-gray-700 p-2 flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">
            Query
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors">
          <h3 className="font-medium text-sm text-gray-900 mb-1">Find API endpoints</h3>
          <p className="text-xs text-gray-500">List all endpoints interacting with the User table.</p>
        </div>
        <div className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors">
          <h3 className="font-medium text-sm text-gray-900 mb-1">Dependency graph</h3>
          <p className="text-xs text-gray-500">What services depend on the authentication module?</p>
        </div>
      </div>
    </div>
  )
}
