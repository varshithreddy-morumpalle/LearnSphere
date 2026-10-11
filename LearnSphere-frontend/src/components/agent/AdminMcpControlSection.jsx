import React, { useState, useEffect } from 'react';
import { Cpu, Terminal, Database, Activity, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdminMcpControlSection() {
  const [mcpData, setMcpData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolArgs, setToolArgs] = useState('{}');
  const [callResult, setCallResult] = useState(null);
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    fetchMcpRegistry();
  }, []);

  const fetchMcpRegistry = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/agents/mcp/tools');
      const data = await res.json();
      setMcpData(data);
      if (data.tools && data.tools.length > 0) {
        setSelectedTool(data.tools[0]);
        setToolArgs(JSON.stringify({ query: "Multi-agent systems" }, null, 2));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCallTool = async () => {
    if (!selectedTool) return;
    setDispatching(true);
    setCallResult(null);
    try {
      let args = {};
      try { args = JSON.parse(toolArgs); } catch (err) {}
      const res = await fetch('http://localhost:5001/api/agents/mcp/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedTool.name, arguments: args })
      });
      const data = await res.json();
      setCallResult(data);
    } catch (e) {
      alert('Tool call failed: ' + e.message);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-xl text-white my-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-600/30 rounded-xl border border-cyan-400/40 text-cyan-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              MCP Protocol Control Room & Diagnostics
            </h2>
            <p className="text-xs text-slate-300">
              Model Context Protocol (MCP) Server Tool Registry & System Performance Monitoring
            </p>
          </div>
        </div>
        <button
          onClick={fetchMcpRegistry}
          className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 text-slate-300 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List: MCP Server Tools */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-mono font-bold text-cyan-400 mb-3">Registered MCP Tools</div>
          {loading ? (
            <div className="text-xs text-slate-400 py-6 text-center">Loading MCP Server...</div>
          ) : (
            <div className="space-y-2">
              {mcpData?.tools?.map((tool) => (
                <button
                  key={tool.name}
                  onClick={() => {
                    setSelectedTool(tool);
                    setToolArgs(JSON.stringify(tool.name === "search_rag_materials" ? { query: "Multi-agent systems" } : { avg_quiz_score: 85, completion_rate_pct: 80, total_time_hours: 12 }, null, 2));
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-mono transition border ${
                    selectedTool?.name === tool.name
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold">{tool.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{tool.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Output: JSON-RPC Dispatch Console */}
        <div className="lg:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
          {selectedTool ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono text-cyan-300 font-bold">Tool: {selectedTool.name}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  MCP Protocol v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">{selectedTool.description}</p>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">JSON-RPC Arguments:</label>
                <textarea
                  rows={3}
                  value={toolArgs}
                  onChange={(e) => setToolArgs(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-cyan-300 focus:outline-none"
                />
              </div>

              <button
                onClick={handleCallTool}
                disabled={dispatching}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                {dispatching ? 'Dispatching MCP Tool...' : 'Dispatch MCP Tool Call'}
              </button>

              {callResult && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-mono text-emerald-400 font-bold mb-1">Server Response Output:</div>
                  <pre className="bg-slate-900 p-3 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-40">
                    {JSON.stringify(callResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-12">Select an MCP tool to inspect schema and execute.</div>
          )}
        </div>
      </div>
    </div>
  );
}
