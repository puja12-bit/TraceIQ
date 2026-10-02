import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';  
import { Network, Activity, Compass } from 'lucide-react';  
import { useEffect, useState } from 'react';  
import { auth } from './lib/firebase';  
import { signInWithEmailAndPassword, onAuthStateChanged, type User } from 'firebase/auth';
import Intelligence from './pages/Intelligence';  
import ImpactAnalysis from './pages/ImpactAnalysis';  

function Sidebar() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`;

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <Network className="w-6 h-6 text-blue-600" />
        <span className="font-bold text-lg tracking-tight">TraceIQ</span>
      </div>
      
      <div className="px-3 py-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Workspace</div>
        <nav className="flex flex-col gap-1">
          <NavLink to="/" className={navLinkClass}>
            <Compass className="w-4 h-4" />
            Ask TraceIQ
          </NavLink>
          <NavLink to="/impact" className={navLinkClass}>
            <Activity className="w-4 h-4" />
            Impact Analysis
          </NavLink>
        </nav>

      </div>
    </aside>
  );
}



function App() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  if (!authReady) return <div className="p-8">Authenticating...</div>;

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <form onSubmit={handleLogin} className="bg-white dark:bg-gray-950 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 w-96 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Network className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">TraceIQ</span>
          </div>
          <h2 className="text-center font-semibold mb-2">Sign in to workspace</h2>
          {loginError && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{loginError}</div>}
          <input 
            type="email" 
            placeholder="Email" 
            className="border p-2 rounded dark:bg-gray-900 dark:border-gray-700" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="border p-2 rounded dark:bg-gray-900 dark:border-gray-700" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            required 
          />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-medium">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden selection:bg-blue-200 selection:text-blue-900">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Intelligence />} />
            <Route path="/impact" element={<ImpactAnalysis />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
