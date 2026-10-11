import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Cpu, 
  Terminal, 
  Target, 
  Layers, 
  Sparkles, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Code2, 
  Zap, 
  Activity,
  ChevronRight,
  Database
} from 'lucide-react';

const AI_API_BASE = 'http://localhost:5001/api/agents';

export default function AiAgentWorkspace() {
  const [activeTab, setActiveTab] = useState('course-builder');

  // State for Course Builder
  const [courseTopic, setCourseTopic] = useState('AI Agent Engineering & MCP Protocols');
  const [targetAudience, setTargetAudience] = useState('AI Developers & Software Engineers');
  const [buildingCourse, setBuildingCourse] = useState(false);
  const [builtCourse, setBuiltCourse] = useState(null);

  // State for Code Sandbox
  const [pythonCode, setPythonCode] = useState(
`# LearnSphere AI Sandbox
import math

def calculate_mastery(scores):
    weights = [0.1, 0.2, 0.3, 0.4]
    return sum(s * w for s, w in zip(scores, weights))

scores = [85, 90, 78, 95]
mastery = calculate_mastery(scores)
print(f"Calculated Student Mastery Index: {mastery:.2f}%")
`
  );
  const [executingCode, setExecutingCode] = useState(false);
  const [codeResult, setCodeResult] = useState(null);

  // State for Skill Gap Analyst
  const [targetRole, setTargetRole] = useState('AI Agent Developer');
  const [analyzingSkill, setAnalyzingSkill] = useState(false);
  const [skillGapResult, setSkillGapResult] = useState(null);

  // State for MCP Protocol Explorer
  const [mcpData, setMcpData] = useState(null);
  const [loadingMcp, setLoadingMcp] = useState(false);
  const [selectedMcpTool, setSelectedMcpTool] = useState(null);
  const [toolArgs, setToolArgs] = useState('{}');
  const [toolCallResult, setToolCallResult] = useState(null);
  const [callingTool, setCallingTool] = useState(false);

  // State for ML Predictor
  const [quizScore, setQuizScore] = useState(82);
  const [completionRate, setCompletionRate] = useState(75);
  const [timeSpent, setTimeSpent] = useState(12);
  const [predictingRisk, setPredictingRisk] = useState(false);
  const [mlResult, setMlResult] = useState(null);

  // Fetch MCP tools on tab switch
  useEffect(() => {
    if (activeTab === 'mcp-explorer' && !mcpData) {
      fetchMcpTools();
    }
  }, [activeTab]);

  const fetchMcpTools = async () => {
    setLoadingMcp(true);
    try {
      const res = await fetch(`${AI_API_BASE}/mcp/tools`);
      const data = await res.json();
      setMcpData(data);
      if (data.tools && data.tools.length > 0) {
        setSelectedMcpTool(data.tools[0]);
        setToolArgs(JSON.stringify({ query: "Multi-agent systems" }, null, 2));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMcp(false);
    }
  };

  const handleBuildCourse = async (e) => {
    e.preventDefault();
    setBuildingCourse(true);
    setBuiltCourse(null);
    try {
      const res = await fetch(`${AI_API_BASE}/course-builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: courseTopic, targetAudience })
      });
      const data = await res.json();
      setBuiltCourse(data);
    } catch (err) {
      alert('Course generation failed: ' + err.message);
    } finally {
      setBuildingCourse(false);
    }
  };

  const handleExecuteCode = async () => {
    setExecutingCode(true);
    setCodeResult(null);
    try {
      const res = await fetch(`${AI_API_BASE}/code-sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pythonCode, question: 'Execute and analyze for bugs' })
      });
      const data = await res.json();
      setCodeResult(data);
    } catch (err) {
      alert('Code sandbox execution failed: ' + err.message);
    } finally {
      setExecutingCode(false);
    }
  };

  const handleAnalyzeSkillGap = async () => {
    setAnalyzingSkill(true);
    setSkillGapResult(null);
    try {
      const res = await fetch(`${AI_API_BASE}/skill-gap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetRole, 
          userProfile: { 
            completedCourses: ["RAG Architecture & Vector DBs", "Python Microservices"],
            quizScores: { RAG: 90, LLMs: 85 }
          } 
        })
      });
      const data = await res.json();
      setSkillGapResult(data);
    } catch (err) {
      alert('Skill Gap Analysis failed: ' + err.message);
    } finally {
      setAnalyzingSkill(false);
    }
  };

  const handleCallMcpTool = async () => {
    if (!selectedMcpTool) return;
    setCallingTool(true);
    setToolCallResult(null);
    try {
      let parsedArgs = {};
      try { parsedArgs = JSON.parse(toolArgs); } catch (e) {}
      const res = await fetch(`${AI_API_BASE}/mcp/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedMcpTool.name, arguments: parsedArgs })
      });
      const data = await res.json();
      setToolCallResult(data);
    } catch (err) {
      alert('MCP Tool dispatch failed: ' + err.message);
    } finally {
      setCallingTool(false);
    }
  };

  const handlePredictMlRisk = async () => {
    setPredictingRisk(true);
    setMlResult(null);
    try {
      const res = await fetch(`http://localhost:5001/api/ml/predict-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avgQuizScore: Number(quizScore),
          completionRatePct: Number(completionRate),
          totalTimeHours: Number(timeSpent),
          quizAttemptsAvg: 1.2,
          consecutiveFailures: 0
        })
      });
      const data = await res.json();
      setMlResult(data.prediction);
    } catch (err) {
      alert('ML Risk Prediction failed: ' + err.message);
    } finally {
      setPredictingRisk(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-400/40 text-indigo-400">
                <Bot className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                  LearnSphere AI Agent Engine & MCP Hub
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Multi-Agent Workflows • Model Context Protocol (MCP) • Scikit-Learn Telemetry Predictor • Hybrid RAG Vector DB
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            MCP Server & Multi-Agent Swarm Online
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-indigo-500/20 pt-4">
          {[
            { id: 'course-builder', label: 'Autonomous Course Builder', icon: Sparkles },
            { id: 'code-sandbox', label: 'AI Code Sandbox & Tutor', icon: Terminal },
            { id: 'skill-gap', label: 'Skill Gap & Career Agent', icon: Target },
            { id: 'mcp-explorer', label: 'MCP Protocol Explorer', icon: Cpu },
            { id: 'ml-telemetry', label: 'ML Telemetry Predictor', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-[1.02]'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto">
        {/* TAB 1: Autonomous Course Builder */}
        {activeTab === 'course-builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Prompt Autonomous Agent
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Supervisor Agent orchestrates CurriculumPlanner, ContentSynthesizer, and Vector RAG Indexer to generate a complete course instantly.
              </p>

              <form onSubmit={handleBuildCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Course Topic
                  </label>
                  <input
                    type="text"
                    value={courseTopic}
                    onChange={(e) => setCourseTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Fintech API Security & Banking AI"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={buildingCourse}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                >
                  {buildingCourse ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Agent Swarm Synthesizing Course...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Execute Multi-Agent Course Builder
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Output Display */}
            <div className="lg:col-span-2 bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                <span>Agentic Execution & Course Syllabus</span>
                {builtCourse && (
                  <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">
                    {builtCourse.indexedRagChunks} Chunks Indexed into ChromaDB
                  </span>
                )}
              </h2>

              {!builtCourse && !buildingCourse && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl p-8 text-center">
                  <Bot className="w-12 h-12 text-slate-600 mb-3" />
                  Enter a topic and launch the Autonomous Multi-Agent Course Creator.
                </div>
              )}

              {buildingCourse && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="font-mono text-xs text-indigo-400">
                    SupervisorAgent ➔ CurriculumPlanner ➔ ContentSynthesizer ➔ ChromaDB Vector Ingestion
                  </div>
                </div>
              )}

              {builtCourse && (
                <div className="space-y-6">
                  {/* Workflow Trace */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 font-mono text-xs text-slate-300">
                    <div className="text-indigo-400 font-bold mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Multi-Agent Execution Trace:
                    </div>
                    {builtCourse.workflowTrace?.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 py-0.5 text-slate-400">
                        <ChevronRight className="w-3 h-3 text-indigo-400" /> {step}
                      </div>
                    ))}
                  </div>

                  {/* Modules */}
                  <div>
                    <h3 className="text-lg font-bold text-indigo-200 mb-1">{builtCourse.courseTitle}</h3>
                    <p className="text-sm text-slate-400 mb-4">{builtCourse.description}</p>

                    <div className="space-y-3">
                      {builtCourse.modules?.map((mod, i) => (
                        <div key={i} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                          <h4 className="font-bold text-white text-sm mb-1">
                            Module {mod.moduleNumber}: {mod.title}
                          </h4>
                          <p className="text-xs text-slate-400 mb-3">{mod.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {mod.lessons?.map((les, j) => (
                              <div key={j} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                                <div className="font-semibold text-indigo-300">{les.title}</div>
                                <div className="text-slate-400 text-[11px] mt-0.5">{les.contentSummary}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI Code Sandbox & Tutor */}
        {activeTab === 'code-sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                Python Code Sandbox
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Execute code safely in the MCP isolated container environment with live step-by-step LLM debugging agent.
              </p>

              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-xs">
                <textarea
                  rows={12}
                  value={pythonCode}
                  onChange={(e) => setPythonCode(e.target.value)}
                  className="w-full bg-transparent text-emerald-300 focus:outline-none resize-none font-mono text-xs leading-relaxed"
                />
              </div>

              <button
                onClick={handleExecuteCode}
                disabled={executingCode}
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                {executingCode ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Executing & Analyzing Code...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Run Code & Launch AI Debugger Agent
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4">Execution Result & AI Tutor Analysis</h2>

              {!codeResult && !executingCode && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl p-8 text-center">
                  <Terminal className="w-12 h-12 text-slate-600 mb-3" />
                  Run your code snippet to view live output and AI Tutor explanation.
                </div>
              )}

              {executingCode && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="font-mono text-xs text-emerald-400">Sandbox container executing Python process...</div>
                </div>
              )}

              {codeResult && (
                <div className="space-y-4">
                  {/* Sandbox Console Output */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
                    <div className="text-slate-400 mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                      <span>Sandbox Console Output</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${codeResult.sandboxResult?.exitCode === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        Exit Code: {codeResult.sandboxResult?.exitCode}
                      </span>
                    </div>
                    {codeResult.sandboxResult?.stdout && (
                      <pre className="text-emerald-400 whitespace-pre-wrap">{codeResult.sandboxResult.stdout}</pre>
                    )}
                    {codeResult.sandboxResult?.stderr && (
                      <pre className="text-rose-400 whitespace-pre-wrap">{codeResult.sandboxResult.stderr}</pre>
                    )}
                  </div>

                  {/* AI Tutor Agent Explanation */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/20 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    <div className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                      <Bot className="w-4 h-4" /> AI Code Tutor Feedback:
                    </div>
                    {codeResult.agentAnalysis}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Skill Gap & Career Agent */}
        {activeTab === 'skill-gap' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Target Job Role Audit
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Evaluates portfolio skills against hiring requirements for positions like Azentio AI Agent Developer.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Target Position
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="AI Agent Developer">AI Agent Developer (Azentio Software)</option>
                    <option value="RAG & Vector DB Engineer">RAG & Vector DB Engineer</option>
                    <option value="LLM Solutions Architect">LLM Solutions Architect</option>
                  </select>
                </div>

                <button
                  onClick={handleAnalyzeSkillGap}
                  disabled={analyzingSkill}
                  className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition"
                >
                  {analyzingSkill ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Auditing Portfolio against Job Spec...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      Run Career & Skill Gap Audit
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4">Readiness Matrix & Action Plan</h2>

              {!skillGapResult && !analyzingSkill && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl p-8 text-center">
                  <Target className="w-12 h-12 text-slate-600 mb-3" />
                  Select target role and trigger the Career Analytics Agent.
                </div>
              )}

              {analyzingSkill && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="font-mono text-xs text-amber-400">Comparing user skills with Azentio AI Agent Developer JD...</div>
                </div>
              )}

              {skillGapResult && (
                <div className="space-y-6">
                  {/* Score Indicator */}
                  <div className="flex items-center gap-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="relative flex items-center justify-center w-20 h-20 bg-amber-500/10 rounded-full border-2 border-amber-500 text-2xl font-extrabold text-amber-400">
                      {skillGapResult.skillGapData?.readinessScore}%
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">{skillGapResult.skillGapData?.targetRole} Readiness</div>
                      <p className="text-xs text-slate-400">
                        Portfolio matched against LLMs, Multi-Agent Swarms, MCP Protocol, and RAG competencies.
                      </p>
                    </div>
                  </div>

                  {/* Career Agent Roadmap */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/20 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    <div className="text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Career Agent 30-Day Recommendation:
                    </div>
                    {skillGapResult.careerRoadmap}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MCP Protocol Explorer */}
        {activeTab === 'mcp-explorer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                MCP Server Registry
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Model Context Protocol standard tools & resources exposed by LearnSphere microservice.
              </p>

              {loadingMcp ? (
                <div className="text-slate-400 text-xs animate-pulse py-8 text-center">Loading MCP Server Registry...</div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Tools</div>
                  {mcpData?.tools?.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => {
                        setSelectedMcpTool(tool);
                        setToolArgs(JSON.stringify(tool.name === "search_rag_materials" ? { query: "Multi-agent RAG" } : { avg_quiz_score: 85, completion_rate_pct: 70, total_time_hours: 10 }, null, 2));
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs font-mono transition border ${
                        selectedMcpTool?.name === tool.name
                          ? 'bg-cyan-600/20 border-cyan-400/50 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold">{tool.name}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{tool.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4">Interactive MCP Dispatch Console</h2>

              {selectedMcpTool && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="font-mono text-xs text-cyan-400 font-bold mb-1">
                      Tool: {selectedMcpTool.name}
                    </div>
                    <div className="text-xs text-slate-400 mb-3">{selectedMcpTool.description}</div>

                    <label className="block text-[11px] font-mono text-slate-400 mb-1">JSON-RPC Arguments:</label>
                    <textarea
                      rows={4}
                      value={toolArgs}
                      onChange={(e) => setToolArgs(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none"
                    />

                    <button
                      onClick={handleCallMcpTool}
                      disabled={callingTool}
                      className="mt-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition"
                    >
                      {callingTool ? 'Dispatching MCP Request...' : 'Dispatch MCP Tool Request'}
                    </button>
                  </div>

                  {toolCallResult && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30">
                      <div className="text-xs font-mono text-cyan-400 font-bold mb-2">MCP JSON-RPC Output Response:</div>
                      <pre className="bg-slate-900 p-3 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto">
                        {JSON.stringify(toolCallResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ML Telemetry Predictor */}
        {activeTab === 'ml-telemetry' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-400" />
                Scikit-Learn ML Predictor
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                RandomForest Machine Learning model predicting student mastery index and dropout risk.
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Average Quiz Score: {quizScore}%</label>
                  <input
                    type="range" min="0" max="100" value={quizScore}
                    onChange={(e) => setQuizScore(e.target.value)}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Course Progress: {completionRate}%</label>
                  <input
                    type="range" min="0" max="100" value={completionRate}
                    onChange={(e) => setCompletionRate(e.target.value)}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Learning Time (Hours): {timeSpent}h</label>
                  <input
                    type="range" min="1" max="30" value={timeSpent}
                    onChange={(e) => setTimeSpent(e.target.value)}
                    className="w-full accent-rose-500"
                  />
                </div>

                <button
                  onClick={handlePredictMlRisk}
                  disabled={predictingRisk}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
                >
                  {predictingRisk ? 'Running ML Inference...' : 'Calculate Mastery & Risk Class'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4">ML Telemetry Output & Proactive Intervention</h2>

              {!mlResult && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl p-8 text-center">
                  <Activity className="w-12 h-12 text-slate-600 mb-3" />
                  Adjust learner telemetry sliders and launch ML prediction inference.
                </div>
              )}

              {mlResult && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Calculated Mastery Index</div>
                      <div className="text-3xl font-extrabold text-white mt-1">{mlResult.masteryIndex}%</div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Risk Classifier Tier</div>
                      <div className={`text-lg font-bold mt-1 ${mlResult.riskCode === 0 ? 'text-emerald-400' : mlResult.riskCode === 1 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {mlResult.riskTier}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-300 mb-3">Model Recommendation Triggers:</div>
                    <div className="space-y-2">
                      {mlResult.recommendations?.map((rec, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
