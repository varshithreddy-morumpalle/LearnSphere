
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
import chromadb
import os
import requests
from bs4 import BeautifulSoup
import fitz  # PyMuPDF
import tempfile
import traceback

# Custom AI Agent & MCP Services
from ml_predictor import ml_predictor
from mcp_server import LearnSphereMCPServer
from agents import MultiAgentEngine

app = Flask(__name__)
CORS(app)

# ============================================================
# CONFIGURATION
# ============================================================
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# New google.genai client
client = genai.Client(api_key=GEMINI_API_KEY)

# ============================================================
# CHROMADB SETUP  -  persistent local vector store
# ============================================================
CHROMA_PATH = "./chroma_db"
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)


EMBEDDING_MODEL = "models/gemini-embedding-2"


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts using Google's gemini-embedding-2 model."""
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )
    return [e.values for e in result.embeddings]


def embed_query(text: str) -> list[float]:
    """Embed a single query text."""
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=[text],
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
    )
    return result.embeddings[0].values


# Collection with cosine similarity (no embedding_function - we manage embeddings ourselves)
collection = chroma_client.get_or_create_collection(
    name="course_materials",
    metadata={"hnsw:space": "cosine"}
)

# ============================================================
# GENERATION MODEL & AGENT INITIALIZATION
# ============================================================
GENERATION_MODEL = "gemini-2.5-flash"

mcp_server = LearnSphereMCPServer(
    chroma_collection=collection,
    gemini_client=client,
    ml_predictor=ml_predictor
)

agent_engine = MultiAgentEngine(
    gemini_client=client,
    mcp_server=mcp_server,
    chroma_collection=collection
)

# ============================================================
# TEXT CHUNKING UTILITY
# ============================================================
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping word-count chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return [c for c in chunks if c.strip()]

# ============================================================
# SYSTEM PROMPT
# ============================================================
BASE_SYSTEM_PROMPT = """
You are the AI Mentor for **LearnSphere**, an AI-powered adaptive learning platform.
Your goal is to be a helpful, professional, and encouraging mentor for students.

**Your Capabilities:**
- You assist students with their course progress, quiz results, and certification status.
- You can explain concepts from their course materials using the COURSE MATERIAL CONTEXT provided below.
- You provide motivation and study tips based on their performance.
- You guide students on how to use the Student Panel features.

**Platform Knowledge Base:**
- **Navigation**: The Dashboard shows all enrolled courses. The Explore page lists new courses.
- **Unenroll**: Go to the Dashboard, find the course card, and click the Unenroll button.
- **Certificates**: Awarded automatically when a course reaches 100% progress.
- **Quizzes**: Found inside course modules. Score 50% or higher to pass.
- **Profile**: Click your avatar in the top-right to edit profile or change password.
- **Progress**: Tracked automatically as you view materials.

**Response Guidelines:**
1. Tone: Professional yet warm and encouraging. Use emojis sparingly.
2. Personalization: Always address the student by name if known.
3. Formatting: Use Markdown with bold terms and lists.
4. Scope: Answer ONLY questions related to LearnSphere, education, coding, or career guidance.
5. RAG Usage: When COURSE MATERIAL CONTEXT is provided, use it for specific, grounded answers.
   - Prefer the retrieved context over generic knowledge.
   - Mention the source material title naturally in your response.
6. Data Usage: Summarize course progress, quiz scores, and certificates when asked.
"""

# ============================================================
# TEXT EXTRACTION UTILITIES
# ============================================================

def download_file(url: str) -> str:
    """Download a file to a temporary location and return the path."""
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    # Get extension from URL
    ext = os.path.splitext(url.split('?')[0])[1]
    if not ext:
        ext = '.tmp'
        
    fd, path = tempfile.mkstemp(suffix=ext)
    with os.fdopen(fd, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    return path

def extract_text_from_material(data: dict) -> str:
    """Extract text from the material payload based on its type."""
    material_type = data.get('materialType', 'TEXT')
    
    if material_type == 'TEXT':
        return data.get('text', '') or data.get('description', '')
        
    elif material_type == 'LINK':
        url = data.get('externalUrl')
        if not url:
            return ""
        try:
            print(f"[RAG] Scraping link: {url}")
            resp = requests.get(url, timeout=10)
            soup = BeautifulSoup(resp.content, 'html.parser')
            # Extract text from p, h1, h2, h3, li
            text_elements = soup.find_all(['p', 'h1', 'h2', 'h3', 'li'])
            text = " ".join([elem.get_text() for elem in text_elements])
            return text
        except Exception as e:
            print(f"[RAG] Failed to scrape {url}: {e}")
            return data.get('description', '')
            
    elif material_type == 'PDF':
        url = data.get('filePath')
        if not url:
            return data.get('description', '')
        try:
            print(f"[RAG] Downloading PDF: {url}")
            local_path = download_file(url)
            text = ""
            with fitz.open(local_path) as doc:
                for page in doc:
                    text += page.get_text()
            os.remove(local_path)
            return text
        except Exception as e:
            print(f"[RAG] Failed to parse PDF {url}: {e}")
            return data.get('description', '')
            
    elif material_type == 'IMAGE':
        url = data.get('filePath')
        if not url:
            return data.get('description', '')
        try:
            print(f"[RAG] Processing Image with Gemini: {url}")
            local_path = download_file(url)
            
            # Use Gemini to describe the image
            uploaded_file = client.files.upload(file=local_path)
            response = client.models.generate_content(
                model=GENERATION_MODEL,
                contents=[
                    uploaded_file,
                    "Describe this educational image in detail. Extract any text, charts, diagrams, or key concepts shown."
                ]
            )
            os.remove(local_path)
            return response.text
        except Exception as e:
            print(f"[RAG] Failed to process Image {url}: {e}")
            return data.get('description', '')
            
    elif material_type == 'VIDEO':
        url = data.get('filePath')
        if not url:
            return data.get('description', '')
        try:
            print(f"[RAG] Processing Video with Gemini: {url}")
            local_path = download_file(url)
            
            uploaded_file = client.files.upload(file=local_path)
            
            # Wait for video processing if needed (Gemini File API handles video)
            import time
            while uploaded_file.state.name == "PROCESSING":
                print(".", end="", flush=True)
                time.sleep(2)
                uploaded_file = client.files.get(name=uploaded_file.name)
                
            if uploaded_file.state.name == "FAILED":
                raise Exception("Video processing failed in Gemini")
                
            response = client.models.generate_content(
                model=GENERATION_MODEL,
                contents=[
                    uploaded_file,
                    "Provide a comprehensive transcript and detailed summary of the concepts taught in this educational video."
                ]
            )
            os.remove(local_path)
            return response.text
        except Exception as e:
            print(f"[RAG] Failed to process Video {url}: {e}")
            return data.get('description', '')
            
    return data.get('description', '')

# ============================================================
# /ingest  -  called by Spring Boot when a material is saved
# ============================================================
@app.route('/ingest', methods=['POST'])
def ingest():
    """
    Expects JSON body:
    {
      "materialId": 42,
      "courseId": 5,
      "topicId": 3,
      "title": "Polymorphism in Java",
      "materialType": "PDF",
      "text": "...",
      "filePath": "https://s3...",
      "externalUrl": "https://..."
    }
    """
    try:
        data        = request.json
        material_id = str(data.get('materialId'))
        course_id   = str(data.get('courseId'))
        topic_id    = str(data.get('topicId'))
        title       = data.get('title', 'Untitled')
        
        # Extract text based on material type
        extracted_text = extract_text_from_material(data)
        
        # Combine title and text for better context
        text = f"Title: {title}\n\n{extracted_text}".strip()

        if not text:
            return jsonify({"status": "skipped", "reason": "Empty text"}), 200

        # Delete existing chunks for re-ingestion on update
        existing = collection.get(where={"materialId": material_id})
        if existing and existing['ids']:
            collection.delete(ids=existing['ids'])
            print(f"[RAG] Deleted {len(existing['ids'])} old chunks for material {material_id}")

        # Chunk the text
        chunks = chunk_text(text, chunk_size=500, overlap=50)
        print(f"[RAG] Ingesting material {material_id} '{title}' -> {len(chunks)} chunks")

        # Embed all chunks
        embeddings = embed_texts(chunks)

        # Build IDs and metadatas
        ids        = [f"mat_{material_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas  = [
            {
                "materialId": material_id,
                "courseId":   course_id,
                "topicId":    topic_id,
                "title":      title,
                "chunkIndex": str(i)
            }
            for i in range(len(chunks))
        ]

        # Add to ChromaDB in batches of 100
        BATCH = 100
        for start in range(0, len(chunks), BATCH):
            collection.add(
                ids=ids[start:start+BATCH],
                documents=chunks[start:start+BATCH],
                embeddings=embeddings[start:start+BATCH],
                metadatas=metadatas[start:start+BATCH]
            )

        return jsonify({
            "status": "success",
            "materialId": material_id,
            "chunksIndexed": len(chunks)
        }), 200

    except Exception as e:
        print(f"[RAG] Ingest error: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



# ============================================================
# /ingest/delete  -  called by Spring Boot when material deleted
# ============================================================
@app.route('/ingest/delete', methods=['POST'])
def ingest_delete():
    """
    Expects JSON body: { "materialId": 42 }
    """
    try:
        data        = request.json
        material_id = str(data.get('materialId'))

        existing = collection.get(where={"materialId": material_id})
        if existing and existing['ids']:
            collection.delete(ids=existing['ids'])
            print(f"[RAG] Deleted {len(existing['ids'])} chunks for material {material_id}")
            return jsonify({"status": "deleted", "chunksRemoved": len(existing['ids'])}), 200

        return jsonify({"status": "not_found", "chunksRemoved": 0}), 200

    except Exception as e:
        print(f"[RAG] Delete error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================
# /rag/status  -  health check for the vector store
# ============================================================
@app.route('/rag/status', methods=['GET'])
def rag_status():
    try:
        count = collection.count()
        return jsonify({
            "status": "ok",
            "vectorStore": "ChromaDB",
            "collection": "course_materials",
            "totalChunks": count,
            "embeddingModel": EMBEDDING_MODEL,
            "generationModel": GENERATION_MODEL
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 500


# ============================================================
# /chat  -  RAG-augmented chat endpoint
# ============================================================
@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Check if form data is used
        if request.content_type and 'multipart/form-data' in request.content_type:
            user_message = request.form.get('message', '').strip()
            import json
            context_str = request.form.get('context', '{}')
            try:
                context = json.loads(context_str)
            except Exception:
                context = {}
            files = request.files.getlist("files")
        else:
            data = request.json or {}
            user_message = data.get('message', '').strip() if data else ""
            context = data.get('context', {}) if data else {}
            files = []

        if not user_message and not files:
            return jsonify({"error": "Message or files are required"}), 400

        # ----------------------------------------------------------
        # 1. RETRIEVAL: query ChromaDB filtered by student's courseIds
        # ----------------------------------------------------------
        course_ids       = context.get('courseIds', [])
        retrieved_chunks = []
        sources          = []

        if course_ids and collection.count() > 0:
            try:
                course_id_strs = [str(cid) for cid in course_ids]

                # Embed the query
                query_embedding = embed_query(user_message)

                # Build where filter
                if len(course_id_strs) == 1:
                    where_filter = {"courseId": course_id_strs[0]}
                else:
                    where_filter = {"courseId": {"$in": course_id_strs}}

                n_results = min(5, collection.count())
                results = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=n_results,
                    where=where_filter,
                    include=["documents", "metadatas", "distances"]
                )

                docs      = results.get('documents', [[]])[0]
                metas     = results.get('metadatas', [[]])[0]
                distances = results.get('distances', [[]])[0]

                # Filter by relevance threshold (cosine distance < 0.7 = relevant)
                for doc, meta, dist in zip(docs, metas, distances):
                    if dist < 0.7:
                        retrieved_chunks.append({
                            "text":  doc,
                            "title": meta.get("title", "Course Material"),
                            "dist":  dist
                        })
                        src_title = meta.get("title", "Course Material")
                        if src_title not in sources:
                            sources.append(src_title)

                print(f"[RAG] Retrieved {len(retrieved_chunks)} relevant chunks (from {len(course_id_strs)} courses)")

            except Exception as e:
                print(f"[RAG] Retrieval error (non-fatal): {e}")

        # ----------------------------------------------------------
        # 2. BUILD AUGMENTED PROMPT
        # ----------------------------------------------------------
        student_name = context.get('studentName', 'Student')
        courses      = context.get('courses', [])
        courses_str  = ", ".join([
            f"{c['title']} ({c.get('progress', 0)}% complete)" for c in courses
        ]) if courses else "No active enrollments"

        material_context_block = ""
        if retrieved_chunks:
            lines = ["\n\n---\nCOURSE MATERIAL CONTEXT (retrieved from enrolled courses):\n"]
            for i, chunk in enumerate(retrieved_chunks, 1):
                lines.append(f"\n[Source {i}: {chunk['title']}]\n{chunk['text']}\n")
            lines.append("\n---\n")
            lines.append(
                "Use the above context to give specific, grounded answers. "
                "Reference the source titles naturally in your response.\n"
            )
            material_context_block = "".join(lines)

        student_data_block = f"""
Student Data:
- Name: {student_name}
- Enrolled Courses: {courses_str}
- Recent Quizzes: {context.get('recentQuizzes', [])}
- Certificates Earned: {context.get('certificates', [])}
"""

        full_system_prompt = BASE_SYSTEM_PROMPT + material_context_block + student_data_block

        # ----------------------------------------------------------
        # 3. GENERATE with Gemini (new google.genai SDK)
        # ----------------------------------------------------------
        user_parts = [types.Part(text=user_message)] if user_message else []
        for file in files:
            file_bytes = file.read()
            mime_type = file.content_type
            filename = file.filename or ""
            print(f"[RAG] Uploaded attachment: {filename} ({mime_type})")
            
            # Normalize MIME type for audio recordings to prevent video analysis errors
            if filename.endswith(".weba") or filename.startswith("recording-"):
                mime_type = "audio/webm"
            elif filename.endswith(".webm") and (mime_type == "video/webm" or mime_type == "application/octet-stream"):
                mime_type = "audio/webm"

            if file_bytes:
                user_parts.append(
                    types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
                )

        if not user_parts:
            user_parts.append(types.Part(text="Analyze the uploaded attachments."))

        response = client.models.generate_content(
            model=GENERATION_MODEL,
            contents=[
                types.Content(role="user",  parts=[types.Part(text=full_system_prompt)]),
                types.Content(role="model", parts=[types.Part(text="Understood. I am ready to assist as the LearnSphere AI Mentor.")]),
                types.Content(role="user",  parts=user_parts)
            ]
        )

        return jsonify({
            "response": response.text,
            "sources":  sources,
            "ragUsed":  len(retrieved_chunks) > 0
        })

    except Exception as e:
        print(f"[RAG] Chat error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Failed to process request"}), 500


# ============================================================
# AI AGENT WORKFLOW & MCP ENDPOINTS
# ============================================================

@app.route('/api/agents/course-builder', methods=['POST'])
def agent_course_builder():
    """Autonomous Multi-Agent Course Synthesizer & Vector Ingestion."""
    try:
        data = request.json or {}
        topic = data.get("topic", "").strip()
        target_audience = data.get("targetAudience", "Students & Developers")

        if not topic:
            return jsonify({"error": "Topic is required"}), 400

        result = agent_engine.run_autonomous_course_builder(topic, target_audience)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/agents/code-sandbox', methods=['POST'])
def agent_code_sandbox():
    """Agentic Code Execution & Debugging Sandbox."""
    try:
        data = request.json or {}
        code = data.get("code", "")
        question = data.get("question", "")

        result = agent_engine.run_code_tutor_agent(code, question)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/agents/skill-gap', methods=['POST'])
def agent_skill_gap():
    """Career Readiness & Skill-Gap Analysis Engine."""
    try:
        data = request.json or {}
        target_role = data.get("targetRole", "AI Agent Developer")
        user_profile = data.get("userProfile", {})

        result = agent_engine.run_career_skill_agent(target_role, user_profile)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/agents/mcp/tools', methods=['GET'])
def mcp_list_tools():
    """Model Context Protocol - List Tools & Resources."""
    try:
        tools = mcp_server.list_tools()
        resources = mcp_server.list_resources()
        return jsonify({
            "status": "ok",
            "protocol": "Model Context Protocol (MCP) v1.0",
            "tools": tools,
            "resources": resources
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/agents/mcp/call', methods=['POST'])
def mcp_call_tool():
    """Model Context Protocol - Dispatch Tool Invocation."""
    try:
        data = request.json or {}
        tool_name = data.get("name", "")
        arguments = data.get("arguments", {})

        output = mcp_server.call_tool(tool_name, arguments)
        return jsonify({
            "tool": tool_name,
            "arguments": arguments,
            "output": output
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ml/predict-risk', methods=['POST'])
def ml_predict_student_risk():
    """Scikit-Learn ML Telemetry Predictor for Student Mastery & Risk."""
    try:
        data = request.json or {}
        res = ml_predictor.predict(
            avg_quiz_score=float(data.get("avgQuizScore", 70)),
            completion_rate_pct=float(data.get("completionRatePct", 50)),
            total_time_hours=float(data.get("totalTimeHours", 5)),
            quiz_attempts_avg=float(data.get("quizAttemptsAvg", 1.2)),
            consecutive_failures=int(data.get("consecutiveFailures", 0))
        )
        return jsonify({"status": "success", "prediction": res}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ============================================================
# MAIN
# ============================================================
if __name__ == '__main__':
    print("=" * 60)
    print("  LearnSphere RAG Service - port 5001")
    print(f"  ChromaDB path    : {os.path.abspath(CHROMA_PATH)}")
    print(f"  Total chunks     : {collection.count()}")
    print(f"  Generation model : {GENERATION_MODEL}")
    print(f"  Embedding model  : {EMBEDDING_MODEL}")
    print("=" * 60)
    app.run(port=5001, debug=True)
