import React, { useState } from 'react';
import { Sparkles, Bot, Play, CheckCircle, ChevronRight, Layers, Users, Zap } from 'lucide-react';

export default function InstructorAiCourseSection({ onCourseCreated }) {
  const [topic, setTopic] = useState('Fintech API Security & AI Architecture');
  const [targetAudience, setTargetAudience] = useState('Banking Developers & Students');
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState(null);

  const handleBuildCourse = async (e) => {
    e.preventDefault();
    setBuilding(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:5001/api/agents/course-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, targetAudience })
      });
      const data = await res.json();
      setResult(data);
      if (onCourseCreated && data.status === 'success') {
        onCourseCreated(data);
      }
    } catch (err) {
      alert('AI Course Generation error: ' + err.message);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-xl text-white my-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-400/40 text-indigo-400">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white">
            Autonomous Multi-Agent Course Creator
          </h2>
          <p className="text-xs text-slate-300">
            SupervisorAgent orchestrates CurriculumPlanner, ContentSynthesizer, and Vector RAG Indexer
          </p>
        </div>
      </div>

      <form onSubmit={handleBuildCourse} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Course Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Target Audience
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={building}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition text-sm"
          >
            {building ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Agents Synthesizing Course...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Generate Course & Vector RAG Chunks
              </>
            )}
          </button>
        </div>
      </form>

      {/* Generated Result Output */}
      {result && (
        <div className="bg-slate-950 p-5 rounded-xl border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-indigo-300">{result.courseTitle}</h3>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
              {result.indexedRagChunks} Chunks Indexed into ChromaDB Vector Store
            </span>
          </div>

          <div className="space-y-3">
            {result.modules?.map((mod, idx) => (
              <div key={idx} className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-xs">
                <div className="font-bold text-white mb-1">Module {mod.moduleNumber}: {mod.title}</div>
                <div className="text-slate-400 mb-2">{mod.description}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {mod.lessons?.map((les, j) => (
                    <div key={j} className="bg-slate-950 p-2 rounded text-[11px] text-indigo-200">
                      <span className="font-semibold text-white">{les.title}:</span> {les.contentSummary}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
