package com.example.skillforge.dto.response;

import java.util.List;

/**
 * ChatResponse — extended to carry RAG metadata back to the frontend.
 * Fields:
 *   response  — the AI-generated text (Markdown)
 *   sources   — list of material titles retrieved by RAG (may be empty)
 *   ragUsed   — true if the answer was grounded by retrieved course material
 */
public class ChatResponse {

    private String response;
    private List<String> sources;
    private boolean ragUsed;

    public ChatResponse() {}

    /** Backward-compatible constructor (non-RAG path) */
    public ChatResponse(String response) {
        this.response = response;
        this.sources  = List.of();
        this.ragUsed  = false;
    }

    /** Full constructor (RAG path) */
    public ChatResponse(String response, List<String> sources, boolean ragUsed) {
        this.response = response;
        this.sources  = sources  != null ? sources : List.of();
        this.ragUsed  = ragUsed;
    }

    // ---- Getters / Setters ----

    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }

    public List<String> getSources() { return sources; }
    public void setSources(List<String> sources) { this.sources = sources; }

    public boolean isRagUsed() { return ragUsed; }
    public void setRagUsed(boolean ragUsed) { this.ragUsed = ragUsed; }
}
