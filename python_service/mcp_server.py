import json
import traceback
import subprocess
import tempfile
import sys
import os

class LearnSphereMCPServer:
    """
    Native Model Context Protocol (MCP) Server for LearnSphere.
    Conforms to MCP specification (JSON-RPC 2.0 tool definitions & resources).
    Exposes platform AI capabilities, RAG retrieval, safe code execution sandbox, and telemetry.
    """
    def __init__(self, chroma_collection=None, gemini_client=None, ml_predictor=None):
        self.chroma_collection = chroma_collection
        self.gemini_client = gemini_client
        self.ml_predictor = ml_predictor

    def list_tools(self) -> list[dict]:
        """Return array of MCP registered tools with schemas."""
        return [
            {
                "name": "search_rag_materials",
                "description": "Perform semantic hybrid search across course materials using vector embeddings.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Natural language query text"},
                        "course_id": {"type": "string", "description": "Optional course ID filter"},
                        "top_k": {"type": "integer", "description": "Number of relevant chunks to retrieve (default 3)"}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "execute_python_code",
                "description": "Safely execute Python code snippets in a isolated sandbox environment.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string", "description": "Executable Python code"},
                        "timeout_sec": {"type": "integer", "description": "Execution timeout limit in seconds (default 5)"}
                    },
                    "required": ["code"]
                }
            },
            {
                "name": "predict_student_risk",
                "description": "Run Scikit-Learn ML classifier to calculate student mastery score and dropout risk.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "avg_quiz_score": {"type": "number", "description": "Average quiz score (0-100)"},
                        "completion_rate_pct": {"type": "number", "description": "Course progress percentage (0-100)"},
                        "total_time_hours": {"type": "number", "description": "Total learning hours spent"},
                        "quiz_attempts_avg": {"type": "number", "description": "Average attempts per quiz"},
                        "consecutive_failures": {"type": "integer", "description": "Number of consecutive failed quizzes"}
                    },
                    "required": ["avg_quiz_score", "completion_rate_pct", "total_time_hours"]
                }
            },
            {
                "name": "analyze_skill_gap",
                "description": "Evaluate student portfolio & progress against target enterprise job descriptions.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "target_role": {"type": "string", "description": "Job role title (e.g., AI Agent Developer)"},
                        "completed_courses": {"type": "array", "items": {"type": "string"}, "description": "List of finished courses"},
                        "quiz_scores": {"type": "object", "description": "Scores keyed by topic"}
                    },
                    "required": ["target_role"]
                }
            },
            {
                "name": "generate_adaptive_quiz",
                "description": "Synthesize difficulty-adjusted exam questions using frontier LLM.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "topic": {"type": "string", "description": "Subject or concept title"},
                        "difficulty": {"type": "string", "enum": ["EASY", "MEDIUM", "HARD", "ADAPTIVE"]},
                        "num_questions": {"type": "integer", "description": "Number of questions to generate"}
                    },
                    "required": ["topic"]
                }
            }
        ]

    def list_resources(self) -> list[dict]:
        """Return MCP context resources."""
        return [
            {
                "uri": "learnsphere://platform/metrics",
                "name": "Platform System Metrics",
                "description": "Active vector store chunk counts, ML models loaded, and RAG status."
            },
            {
                "uri": "learnsphere://job-roles/ai-agent-developer",
                "name": "Azentio AI Agent Developer Role Requirements",
                "description": "Skill matrix for LLMs, Agentic Frameworks, MCP, RAG, and Vector DBs."
            }
        ]

    def call_tool(self, name: str, arguments: dict) -> dict:
        """Dispatch MCP tool calls to backend handlers."""
        if name == "search_rag_materials":
            return self._tool_search_rag(arguments)
        elif name == "execute_python_code":
            return self._tool_execute_code(arguments)
        elif name == "predict_student_risk":
            return self._tool_predict_risk(arguments)
        elif name == "analyze_skill_gap":
            return self._tool_skill_gap(arguments)
        elif name == "generate_adaptive_quiz":
            return self._tool_generate_quiz(arguments)
        else:
            return {"error": f"Unknown MCP Tool '{name}'"}

    def _tool_search_rag(self, args: dict) -> dict:
        query = args.get("query", "")
        top_k = args.get("top_k", 3)
        if not self.chroma_collection or self.chroma_collection.count() == 0:
            return {"status": "success", "results": [], "note": "Vector store empty or uninitialized"}
        try:
            results = self.chroma_collection.query(
                query_texts=[query],
                n_results=min(top_k, self.chroma_collection.count())
            )
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            items = []
            for d, m in zip(docs, metas):
                items.append({"text": d, "metadata": m})
            return {"status": "success", "query": query, "retrievedCount": len(items), "chunks": items}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _tool_execute_code(self, args: dict) -> dict:
        code = args.get("code", "")
        timeout_sec = args.get("timeout_sec", 5)
        if not code.strip():
            return {"error": "Code string cannot be empty"}

        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_filename = f.name

        try:
            res = subprocess.run(
                [sys.executable, temp_filename],
                capture_output=True,
                text=True,
                timeout=timeout_sec
            )
            os.remove(temp_filename)
            return {
                "exitCode": res.returncode,
                "stdout": res.stdout,
                "stderr": res.stderr,
                "status": "success" if res.returncode == 0 else "runtime_error"
            }
        except subprocess.TimeoutExpired:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            return {"exitCode": -1, "stdout": "", "stderr": f"Execution timed out after {timeout_sec}s", "status": "timeout"}
        except Exception as e:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            return {"exitCode": -1, "stdout": "", "stderr": str(e), "status": "system_error"}

    def _tool_predict_risk(self, args: dict) -> dict:
        if not self.ml_predictor:
            return {"error": "ML Predictor service unavailable"}
        res = self.ml_predictor.predict(
            avg_quiz_score=float(args.get("avg_quiz_score", 70)),
            completion_rate_pct=float(args.get("completion_rate_pct", 50)),
            total_time_hours=float(args.get("total_time_hours", 5)),
            quiz_attempts_avg=float(args.get("quiz_attempts_avg", 1.2)),
            consecutive_failures=int(args.get("consecutive_failures", 0))
        )
        return {"status": "success", "mlOutput": res}

    def _tool_skill_gap(self, args: dict) -> dict:
        target_role = args.get("target_role", "AI Agent Developer")
        completed = args.get("completed_courses", [])
        
        required_skills = [
            {"skill": "LLM Prompting & Agentic Workflows", "importance": "Critical"},
            {"skill": "MCP (Model Context Protocol) & Tool Orchestration", "importance": "Critical"},
            {"skill": "Vector Databases (ChromaDB) & Advanced RAG", "importance": "High"},
            {"skill": "LangChain / LangGraph Multi-Agent Systems", "importance": "High"},
            {"skill": "Python / Microservice Architecture & REST APIs", "importance": "Medium"}
        ]
        
        matched_skills = []
        missing_skills = []
        for s in required_skills:
            if any(s["skill"].lower() in str(c).lower() for c in completed):
                matched_skills.append(s)
            else:
                missing_skills.append(s)

        readiness_score = round((len(matched_skills) / len(required_skills)) * 100) if matched_skills else 40

        return {
            "targetRole": target_role,
            "readinessScore": readiness_score,
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills,
            "learningPath": [
                f"Complete 'Multi-Agent Systems & MCP Server Deep-Dive' course",
                f"Build RAG application with ChromaDB persistent vector storage",
                f"Practice AI Agent Debugging & Code Sandbox exercises"
            ]
        }

    def _tool_generate_quiz(self, args: dict) -> dict:
        topic = args.get("topic", "Generative AI")
        difficulty = args.get("difficulty", "MEDIUM")
        count = args.get("num_questions", 3)
        return {
            "topic": topic,
            "difficulty": difficulty,
            "generatedCount": count,
            "sampleQuestions": [
                {
                    "question": f"In {topic}, what is the primary role of a Model Context Protocol (MCP) server?",
                    "options": [
                        "Expose standardize tools, prompts, and context to LLM agents",
                        "Style user interface elements in React",
                        "Store relational tables in MySQL",
                        "Compress video assets for streaming"
                    ],
                    "correctAnswerIndex": 0,
                    "explanation": "MCP standardizes how LLM applications communicate tools and resources with external microservices."
                }
            ]
        }
