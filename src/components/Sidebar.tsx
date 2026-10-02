import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AppWindow, 
  BookOpen, 
  Search, 
  ListTree, 
  ActivitySquare, 
  FileBox
} from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Applications', href: '/applications', icon: AppWindow },
  { name: 'Knowledge Explorer', href: '/knowledge-explorer', icon: BookOpen },
  { name: 'Ask Application', href: '/ask-application', icon: Search },
  { name: 'Feature Details', href: '/feature-details', icon: ListTree },
  { name: 'Impact Analysis', href: '/impact-analysis', icon: ActivitySquare },
  { name: 'Artifacts', href: '/artifacts', icon: FileBox },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50/50">
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">TQ</span>
          </div>
          TraceIQ
        </div>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 hover:text-gray-900 transition-colors",
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-500"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
