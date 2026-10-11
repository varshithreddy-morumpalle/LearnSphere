import React, { useState, useEffect } from 'react';
import { Target, Activity, Sparkles, CheckCircle, AlertTriangle, ChevronRight, Bot, Zap } from 'lucide-react';

export default function StudentSkillAndRiskSection({ studentName = "Student", avgQuizScore = 82, completionRate = 75, hoursSpent = 12 }) {
  const [targetRole, setTargetRole] = useState('AI Agent Developer');
  const [analyzingSkill, setAnalyzingSkill] = useState(false);
  const [skillResult, setSkillResult] = useState(null);

  const [predictingRisk, setPredictingRisk] = useState(false);
  const [mlResult, setMlResult] = useState(null);

  // Auto-run ML prediction on mount for student
  useEffect(() => {
    runMlPrediction();
  }, [avgQuizScore, completionRate, hoursSpent]);

  const runMlPrediction = async () => {
    setPredictingRisk(true);
    try {
      const res = await fetch('http://localhost:5001/api/ml/predict-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avgQuizScore: Number(avgQuizScore),
          completionRatePct: Number(completionRate),
          totalTimeHours: Number(hoursSpent),
          quizAttemptsAvg: 1.2,
          consecutiveFailures: 0
        })
      });
      const data = await res.json();
      setMlResult(data.prediction);
    } catch (e) {
      console.error(e);
    } finally {
      setPredictingRisk(false);
    }
  };

  const runSkillGapAudit = async () => {
    setAnalyzingSkill(true);
    try {
      const res = await fetch('http://localhost:5001/api/agents/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          userProfile: {
            completedCourses: ["RAG Architecture", "Python REST APIs"],
            quizScores: { RAG: avgQuizScore }
          }
        })
      });
      const data = await res.json();
      setSkillResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingSkill(false);
    }
  };

  return (
    <div className="space-y-6 my-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-400/40 text-indigo-400">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                Student AI Assistant & Career Telemetry
              </h2>
              <p className="text-xs text-slate-300">
                Personalized Scikit-Learn Mastery Score & Enterprise Job Skill Gap Auditor
              </p>
            </div>
          </div>
          <button
            onClick={runSkillGapAudit}
            disabled={analyzingSkill}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            {analyzingSkill ? 'Analyzing...' : 'Run Career Skill Audit'}
          </button>
        </div>

        {/* ML Risk & Mastery Bar */}
        {mlResult && (
          <div className="mt-6 pt-6 border-t border-indigo-500/20 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Calculated Mastery Index</div>
              <div className="text-2xl font-extrabold text-white mt-1">{mlResult.masteryIndex}%</div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">ML Risk Status</div>
              <div className={`text-sm font-bold mt-1.5 flex items-center gap-1.5 ${mlResult.riskCode === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                <CheckCircle className="w-4 h-4" />
                {mlResult.riskTier} ({Math.round(mlResult.confidenceScore * 100)}% confidence)
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">AI Proactive Intervention</div>
              <div className="text-xs text-indigo-300 mt-1.5 truncate">
                {mlResult.recommendations?.[0] || 'Keep up the great learning momentum!'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skill Gap Results Modal/Card */}
      {skillResult && (
        <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl text-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Target className="w-5 h-5" /> Target Role Audit: {skillResult.skillGapData?.targetRole}
            </h3>
            <span className="text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full">
              Readiness: {skillResult.skillGapData?.readinessScore}%
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs leading-relaxed whitespace-pre-line text-slate-200">
            <div className="text-amber-400 font-bold mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Personalized 30-Day Technical Plan:
            </div>
            {skillResult.careerRoadmap}
          </div>
        </div>
      )}
    </div>
  );
}
