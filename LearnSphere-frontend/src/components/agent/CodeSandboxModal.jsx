import React, { useState } from 'react';
import { Terminal, Play, X, Bot, CheckCircle } from 'lucide-react';

export default function CodeSandboxModal({ isOpen, onClose }) {
  const [code, setCode] = useState(
`# Interactive Python Sandbox
def calculate_mastery(score, progress):
    return (score * 0.6) + (progress * 0.4)

result = calculate_mastery(88, 90)
print(f"Student Mastery Output: {result:.1f}%")
`
  );
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleRunCode = async () => {
    setExecuting(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:5001/api/agents/code-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, question: 'Analyze logic and execute' })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert('Execution failed: ' + e.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Terminal className="w-5 h-5 text-emerald-400" />
            Interactive AI Code Sandbox & Live Debugger
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Python Code Editor:</label>
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
              <textarea
                rows={10}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-none leading-relaxed"
              />
            </div>
            <button
              onClick={handleRunCode}
              disabled={executing}
              className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition text-sm"
            >
              {executing ? 'Executing Sandbox...' : 'Run Code & Launch AI Debugger'}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-3">
            <div className="font-mono text-slate-400 font-bold border-b border-slate-800 pb-2">Output Console & Feedback</div>
            {!result && !executing && (
              <div className="text-slate-500 py-12 text-center">Run code to view output console and AI Tutor analysis.</div>
            )}
            {result && (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-mono text-emerald-400 font-semibold mb-1">Console Output:</div>
                  <pre className="bg-slate-900 p-2.5 rounded text-emerald-300 font-mono text-[11px]">
                    {result.sandboxResult?.stdout || result.sandboxResult?.stderr || 'No output'}
                  </pre>
                </div>
                <div>
                  <div className="text-[11px] font-mono text-indigo-400 font-semibold mb-1 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" /> AI Code Tutor Feedback:
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line bg-slate-900/60 p-2.5 rounded border border-indigo-500/20">
                    {result.agentAnalysis}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
