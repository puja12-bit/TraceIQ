import { Layers } from "lucide-react"

export default function FeatureDetails() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feature Details</h1>
          <p className="text-gray-500 text-sm">Deep dive into implementation and dependencies of features.</p>
        </div>
        <div className="flex gap-2">
          <select className="border rounded-md px-3 py-1.5 text-sm bg-white">
            <option>Select Application</option>
          </select>
          <select className="border rounded-md px-3 py-1.5 text-sm bg-white">
            <option>Select Feature</option>
          </select>
        </div>
      </div>

      <div className="border rounded-xl bg-white shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <Layers className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No feature selected</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
          Select an application and a specific feature to view its tracing, code dependencies, and data models.
        </p>
      </div>
    </div>
  )
}
