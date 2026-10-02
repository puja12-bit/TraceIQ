import { useState } from 'react';
import { Play, Loader2, AlertTriangle, CheckCircle2, ChevronRight, ArrowDown, GitBranch } from 'lucide-react';
import { auth } from '../lib/firebase';

interface Artifact {
  id: string;
  type: string;
  name: string;
  description: string;
}

interface Trace {
  fromArtifactId: string;
  relationship: string;
  toArtifactId: string;
}

interface RetrievedContext {
  retrievedArtifacts: Artifact[];
  relationshipPaths: Trace[];
}

export default function ImpactAnalysis() {
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<RetrievedContext | null>(null);
  const [error, setError] = useState('');
  
  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) throw new Error("Authentication required.");
      const token = await auth.currentUser.getIdToken();
      const q = "What would be affected if B2B eligibility changed from 12 months to 6 months?";
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/retrieve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId: 'app-nexaone', question: q })
      });
      if (!res.ok) throw new Error("Failed to retrieve impacts.");
      const data = await res.json();
      setContext(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const artifacts = context?.retrievedArtifacts || [];
  const trace = context?.relationshipPaths || [];

  const groupByType = (type: string) => artifacts.filter(a => a.type === type);
  const getArtifact = (id: string) => artifacts.find(a => a.id === id);
  
  const groups = [
    { label: "Requirements", type: "requirement" },
    { label: "Business Rules", type: "rule" },
    { label: "Configuration", type: "configuration" },
    { label: "Code", type: "code" },
    { label: "UI / Design", type: "design" },
    { label: "Tests", type: "test" },
    { label: "Releases", type: "release" },
    { label: "Decisions", type: "decision" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Impact Analysis</h1>
        <p className="text-gray-500 text-sm">Analyze structural and cascading impacts of proposed changes across the application.</p>
      </header>

      <section className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-lg">Scenario: B2B Eligibility Threshold</h3>
            <p className="text-sm text-gray-500 mt-1">What would be affected if B2B eligibility changed from 12 months to 6 months?</p>
          </div>
          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Analysis
          </button>
        </div>
      </section>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center gap-3 mb-8">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {context && (
        <div className="space-y-10">
          
          <div className="space-y-4">
            <h2 className="text-xl font-medium flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-600" />
              Dependency Visualization
            </h2>
            <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center">
               {trace.length > 0 ? (
                 <div className="flex flex-col items-start w-full max-w-2xl mx-auto">
                    {(() => {
                      const traceUI: any[] = [];
                      let lastNode = '';
                      trace.forEach((t, i) => {
                        const fromArt = getArtifact(t.fromArtifactId);
                        const toArt = getArtifact(t.toArtifactId);
                        
                        if (t.fromArtifactId !== lastNode) {
                          traceUI.push(
                            <div key={`node-${t.fromArtifactId}-${i}`} className="w-full p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg shadow-sm">
                              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">{fromArt ? fromArt.type : 'Artifact'}</div>
                              <div className="font-semibold">{fromArt ? fromArt.name : t.fromArtifactId}</div>
                            </div>
                          );
                        }
                        traceUI.push(
                          <div key={`rel-${i}`} className="flex flex-col items-center py-2 ml-8">
                            <ArrowDown className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider my-1">{t.relationship}</span>
                            <ArrowDown className="w-4 h-4 text-gray-400" />
                          </div>
                        );
                        traceUI.push(
                          <div key={`node-${t.toArtifactId}-${i}-to`} className="w-full p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg shadow-sm">
                            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">{toArt ? toArt.type : 'Artifact'}</div>
                            <div className="font-semibold">{toArt ? toArt.name : t.toArtifactId}</div>
                          </div>
                        );
                        lastNode = t.toArtifactId;
                      });
                      return traceUI;
                    })()}
                 </div>
               ) : (
                 <p className="text-gray-500 italic">No dependency relationships found.</p>
               )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-medium flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Impact Graph Assembled ({artifacts.length} nodes)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map(g => {
                const items = groupByType(g.type);
                if (items.length === 0) return null;
                
                return (
                  <div key={g.type} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">{g.label} ({items.length})</h3>
                    <ul className="space-y-2">
                      {items.map(item => (
                        <li key={item.id} className="flex flex-col p-3 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-blue-700 dark:text-blue-400">{item.id}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">{item.name}</span>
                          <span className="text-xs text-gray-500 mt-1 truncate">{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
