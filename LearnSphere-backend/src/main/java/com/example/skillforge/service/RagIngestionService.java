package com.example.skillforge.service;

import com.example.skillforge.model.entity.Material;
import com.example.skillforge.model.enums.MaterialType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * RagIngestionService
 *
 * Responsible for sending material data to the RAG vector store
 * (ChromaDB, running inside the Python Flask service on port 5001).
 *
 * Hooks:
 *   - Called by MaterialService after every create/update
 *   - Called by MaterialService before every delete
 *
 * Now supports all material types (PDF, VIDEO, IMAGE, LINK, TEXT).
 * The extraction logic for complex types is delegated to the Python service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RagIngestionService {

    private static final String PYTHON_SERVICE_BASE = "http://localhost:5001";
    private static final String INGEST_URL          = PYTHON_SERVICE_BASE + "/ingest";
    private static final String INGEST_DELETE_URL   = PYTHON_SERVICE_BASE + "/ingest/delete";

    private final RestTemplate restTemplate = new RestTemplate();

    // ----------------------------------------------------------------
    //  PUBLIC API
    // ----------------------------------------------------------------

    /**
     * Asynchronously ingest a material into the RAG vector store.
     * Runs in a background thread so it never blocks the HTTP response.
     */
    @Async
    public void ingestMaterial(Material material) {
        try {
            // Build payload with all fields needed for multi-modal ingestion
            Map<String, Object> payload = new HashMap<>();
            payload.put("materialId", material.getId());
            payload.put("courseId",   material.getTopic() != null
                    ? material.getTopic().getCourse().getId() : null);
            payload.put("topicId",    material.getTopic() != null
                    ? material.getTopic().getId() : null);
            payload.put("title",      material.getTitle());
            payload.put("description", material.getDescription());
            payload.put("materialType", material.getMaterialType().name());
            
            // Text for TEXT type
            payload.put("text",       material.getTextContent());
            
            // URLs for fetching files or scraping links in Python
            payload.put("filePath",   material.getFilePath());
            payload.put("externalUrl", material.getExternalUrl());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(INGEST_URL, entity, Map.class);
            log.info("[RAG] Ingested material {} ({}) — response: {}", material.getId(), material.getMaterialType(), response);

        } catch (Exception e) {
            // Non-fatal: RAG ingestion failure should never break the main flow
            log.warn("[RAG] Ingestion failed for material {} (non-fatal): {}", material.getId(), e.getMessage());
        }
    }

    /**
     * Asynchronously delete all vectors for a material from the RAG store.
     */
    @Async
    public void deleteMaterial(Long materialId) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("materialId", materialId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(INGEST_DELETE_URL, entity, Map.class);
            log.info("[RAG] Deleted vectors for material {} — response: {}", materialId, response);

        } catch (Exception e) {
            log.warn("[RAG] Delete failed for material {} (non-fatal): {}", materialId, e.getMessage());
        }
    }
}
