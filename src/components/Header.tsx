import { Bell, Search, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-white px-6">
      <div className="w-full flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="search"
              placeholder="Search workspaces..."
              className="w-full appearance-none bg-gray-50/50 pl-8 pr-4 py-2 text-sm shadow-none border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>
      <button className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors">
        <Bell className="h-4 w-4 text-gray-500" />
        <span className="sr-only">Toggle notifications</span>
      </button>
      <button className="rounded-full w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors border">
        <User className="h-4 w-4 text-gray-600" />
        <span className="sr-only">Toggle user menu</span>
      </button>
    </header>
  );
}
