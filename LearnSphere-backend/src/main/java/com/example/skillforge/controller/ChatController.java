package com.example.skillforge.controller;

import com.example.skillforge.dto.request.ChatRequest;
import com.example.skillforge.dto.response.ChatResponse;
import com.example.skillforge.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    @Autowired
    private ChatService chatService;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String PYTHON_SERVICE_BASE = "http://localhost:5001";

    /**
     * Main chat endpoint — RAG-augmented Q&A for authenticated students.
     */
    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        ChatResponse response = chatService.processChat(email, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatResponse> chatMultipart(
            @RequestParam("message") String message,
            @RequestParam(value = "files", required = false) org.springframework.web.multipart.MultipartFile[] files) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        ChatResponse response = chatService.processChatMultipart(email, message, files);
        return ResponseEntity.ok(response);
    }

    /**
     * RAG health check — returns ChromaDB vector store status.
     * Can be polled from admin dashboard or frontend settings.
     */
    @GetMapping("/rag/status")
    public ResponseEntity<Map<String, Object>> ragStatus() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> status = restTemplate.getForObject(
                    PYTHON_SERVICE_BASE + "/rag/status", Map.class);
            return ResponseEntity.ok(status != null ? status : Map.of("status", "unreachable"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "status", "error",
                    "detail", "Python service unreachable: " + e.getMessage()
            ));
        }
    }
}
