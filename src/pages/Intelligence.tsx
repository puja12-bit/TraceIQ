import { useState } from 'react';
import { Search, AlertTriangle, HelpCircle, Activity, FileJson, CheckCircle2, AlertOctagon, GitBranch, BrainCircuit, Lightbulb, ArrowDown, Database } from 'lucide-react';
import { auth } from '../lib/firebase';

interface Claim {
  statement: string;
  evidenceArtifactIds: string[];
}
interface Trace {
  fromArtifactId: string;
  relationship: string;
  toArtifactId: string;
}
interface Conflict {
  artifactIds: string[];
  explanation: string;
}
interface TraceIQResponse {
  answer: string;
  confidence: string;
  claims: Claim[];
  trace: Trace[];
  conflicts: Conflict[];
  knowledgeGaps: string[];
}
interface Artifact {
  id: string;
  type: string;
  name: string;
  description: string;
  content: string;
  applicationId: string;
}
interface RetrievedContext {
  retrievedArtifacts: Artifact[];
  relationshipPaths: Trace[];
}

const EXAMPLES = [
  "Why does an 8-month-old telecom customer not see B2B?",
  "Why does the system have a 12-month threshold?",
  "Is the documentation consistent with the current implementation?",
  "What would be affected if the threshold changed from 12 months to 6 months?"
];

export default function Intelligence() {
  const [query, setQuery] = useState("");
  const [loadingPhase, setLoadingPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<TraceIQResponse | null>(null);
  const [context, setContext] = useState<RetrievedContext | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setError(null);
    setResponse(null);
    setContext(null);
    setSelectedArtifactId(null);

    try {
      if (!auth.currentUser) throw new Error("Authentication required.");
      const token = await auth.currentUser.getIdToken();
      setLoadingPhase("Searching application knowledge...");
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const retRes = await fetch(`${apiUrl}/api/retrieve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ applicationId: 'app-nexaone', question: q })
      });
      if (!retRes.ok) throw new Error(await retRes.text());
      const ctx = await retRes.json();
      setContext(ctx);

      setLoadingPhase("Tracing related artifacts...");
      await new Promise(r => setTimeout(r, 600));

      setLoadingPhase("Analyzing evidence...");
      await new Promise(r => setTimeout(r, 600));

      setLoadingPhase("Building explanation...");
      const reasonRes = await fetch(`${apiUrl}/api/reason`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId: 'app-nexaone', question: q, context: ctx })
      });
      if (!reasonRes.ok) throw new Error(await reasonRes.text());
      const ans = await reasonRes.json();
      setResponse(ans);
    } catch (e: any) {
      setError("TraceIQ couldn't complete the analysis. " + e.message);
    } finally {
      setLoadingPhase(null);
    }
  };

  const getArtifact = (id: string) => context?.retrievedArtifacts?.find(a => a.id === id);
  const selectedArtifact = getArtifact(selectedArtifactId || '');

  const hasSecondaryPanel = selectedArtifact || (response?.conflicts && response.conflicts.length > 0) || (response?.knowledgeGaps && response.knowledgeGaps.length > 0);

  return (
    <div className="flex w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-8 pb-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm z-10">
          <h1 className="text-3xl font-bold tracking-tight mb-1">NexaOne Customer Portal</h1>
          <h2 className="text-lg text-gray-500 font-medium mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Application Intelligence
          </h2>

          <div className="relative max-w-3xl">
            <input 
              type="text" 
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-12 pr-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base outline-none transition-shadow"
              placeholder="Ask how this application works..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
              disabled={!!loadingPhase}
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 relative">
          {!response && !loadingPhase && !error && (
            <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mt-12">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-200 dark:border-blue-800">
                <BrainCircuit className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Understand why an enterprise application behaves the way it does.
              </h2>
              <p className="max-w-md mb-12 text-gray-500 dark:text-gray-400">
                Ask a question. Trace the evidence. Understand the impact.
              </p>
              
              <div className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Try a scenario
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {EXAMPLES.map(ex => (
                    <button 
                      key={ex} 
                      onClick={() => handleSearch(ex)}
                      className="text-left p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loadingPhase && (
            <div className="flex items-center justify-center p-12 flex-col gap-4 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="font-medium animate-pulse">{loadingPhase}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-3 max-w-3xl">
              <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error}</p>
                <button onClick={() => handleSearch(query)} className="text-sm underline mt-2 hover:text-red-900">Retry</button>
              </div>
            </div>
          )}

          {response && (
            <div className="max-w-3xl space-y-8 pb-20">
              
              {/* ANSWER */}
              <div className="bg-white dark:bg-gray-950 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Answer</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md uppercase tracking-wider ${
                    response.confidence === 'high' ? 'bg-green-100 text-green-800' :
                    response.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {response.confidence} Confidence
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg">{response.answer}</p>
              </div>

              {/* EVIDENCE / ELIGIBILITY FACTORS */}
              {response.claims && response.claims.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" /> Eligibility factors
                  </h3>
                  {response.claims.map((c, i) => (
                    <div key={i} className="bg-white dark:bg-gray-950 p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4">{c.statement}</p>
                      <div className="flex flex-col gap-2">
                        {c.evidenceArtifactIds.map(id => {
                          const art = getArtifact(id);
                          return (
                            <button 
                              key={id}
                              onClick={() => setSelectedArtifactId(id)}
                              className="text-left group flex flex-col p-3 rounded-md bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors"
                            >
                              <span className="font-semibold text-sm text-gray-900 group-hover:text-blue-800">{art ? art.name : id}</span>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 uppercase tracking-wide">
                                <span>{art ? art.type : 'Artifact'}</span>
                                <span>&middot;</span>
                                <span className="font-mono lowercase">{id}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TRACE VISUALIZATION */}
              {response.trace && response.trace.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-blue-600" /> How TraceIQ reached this answer
                  </h3>
                  <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex flex-col items-start">
                      {(() => {
                        const traceUI: any[] = [];
                        let lastNode = '';
                        response.trace.forEach((t, i) => {
                          const fromArt = getArtifact(t.fromArtifactId);
                          const toArt = getArtifact(t.toArtifactId);
                          
                          if (t.fromArtifactId !== lastNode) {
                            traceUI.push(
                              <button key={`node-${t.fromArtifactId}-${i}`} onClick={() => setSelectedArtifactId(t.fromArtifactId)} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-md shadow-sm font-medium text-sm transition-colors text-left max-w-full">
                                {fromArt ? fromArt.name : t.fromArtifactId}
                              </button>
                            );
                          }
                          traceUI.push(
                            <div key={`rel-${i}`} className="flex flex-col items-center py-2 ml-4">
                              <ArrowDown className="w-4 h-4 text-gray-400" />
                              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider my-1">{t.relationship}</span>
                              <ArrowDown className="w-4 h-4 text-gray-400" />
                            </div>
                          );
                          traceUI.push(
                            <button key={`node-${t.toArtifactId}-${i}-to`} onClick={() => setSelectedArtifactId(t.toArtifactId)} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-md shadow-sm font-medium text-sm transition-colors text-left max-w-full">
                              {toArt ? toArt.name : t.toArtifactId}
                            </button>
                          );
                          lastNode = t.toArtifactId;
                        });
                        return traceUI;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-12 text-sm text-gray-500 italic pt-6 border-t border-gray-200 dark:border-gray-800">
                TraceIQ doesn't just answer questions about your application. It traces the evidence behind the answer.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Panel */}
      {hasSecondaryPanel && (
        <div className="w-[400px] flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col h-full shadow-xl z-20">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900 shrink-0">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Inspector
            </h3>
            <button 
              onClick={() => {
                setSelectedArtifactId(null);
                // We keep conflicts visible if any
              }}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              &times;
            </button>
          </div>
          
          <div className="p-5 overflow-y-auto flex-1 space-y-8">
            
            {/* CONFLICTS */}
            {response?.conflicts && response.conflicts.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> DOCUMENTATION CONFLICT
                </div>
                {response.conflicts.map((c, i) => (
                  <div key={i} className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-4">
                    <div className="flex flex-col gap-3">
                      {c.artifactIds.map((id, idx) => {
                         const lbl = idx === 0 ? 'Legacy requirement' : 'Current requirement';
                         return (
                           <div key={id} className="text-sm border-l-2 border-red-400 pl-3">
                             <span className="text-red-800 font-semibold text-xs uppercase tracking-wide">{lbl}</span><br/>
                             <button onClick={() => setSelectedArtifactId(id)} className="font-mono text-red-600 hover:underline mt-1">{id}</button>
                           </div>
                         );
                      })}
                    </div>
                    <p className="text-sm text-red-900 border-t border-red-200 pt-3">{c.explanation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* KNOWLEDGE GAPS */}
            {response?.knowledgeGaps && response.knowledgeGaps.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" /> KNOWLEDGE GAP
                </div>
                {response.knowledgeGaps.map((gap, i) => (
                  <div key={i} className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-900">{gap}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ARTIFACT DETAILS */}
            {selectedArtifact && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-4">
                  <FileJson className="w-4 h-4" /> Artifact Details
                </div>
                
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Title</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{selectedArtifact.name}</div>
                </div>
                
                <div className="flex gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ID</div>
                    <div className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded border border-gray-200">{selectedArtifact.id}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Type</div>
                    <div className="inline-block text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {selectedArtifact.type}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedArtifact.description}</p>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Content</div>
                  <pre className="text-xs font-mono bg-gray-50 p-3 rounded-md border border-gray-200 overflow-x-auto whitespace-pre-wrap text-gray-800">
                    {selectedArtifact.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
