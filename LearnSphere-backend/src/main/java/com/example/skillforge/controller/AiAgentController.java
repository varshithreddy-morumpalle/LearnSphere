package com.example.skillforge.controller;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/agents")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AiAgentController {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String PYTHON_SERVICE_BASE = "http://localhost:5001";

    @PostMapping("/course-builder")
    public ResponseEntity<?> buildAutonomousCourse(@RequestBody Map<String, Object> payload) {
        return forwardPost("/api/agents/course-builder", payload);
    }

    @PostMapping("/code-sandbox")
    public ResponseEntity<?> executeCodeSandbox(@RequestBody Map<String, Object> payload) {
        return forwardPost("/api/agents/code-sandbox", payload);
    }

    @PostMapping("/skill-gap")
    public ResponseEntity<?> analyzeSkillGap(@RequestBody Map<String, Object> payload) {
        return forwardPost("/api/agents/skill-gap", payload);
    }

    @GetMapping("/mcp/tools")
    public ResponseEntity<?> getMcpTools() {
        try {
            Map<?, ?> response = restTemplate.getForObject(PYTHON_SERVICE_BASE + "/api/agents/mcp/tools", Map.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", "Python service unreachable: " + e.getMessage()));
        }
    }

    @PostMapping("/mcp/call")
    public ResponseEntity<?> callMcpTool(@RequestBody Map<String, Object> payload) {
        return forwardPost("/api/agents/mcp/call", payload);
    }

    @PostMapping("/predict-risk")
    public ResponseEntity<?> predictStudentRisk(@RequestBody Map<String, Object> payload) {
        return forwardPost("/api/ml/predict-risk", payload);
    }

    private ResponseEntity<?> forwardPost(String path, Map<String, Object> payload) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    PYTHON_SERVICE_BASE + path,
                    requestEntity,
                    Map.class
            );
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", "Failed to forward request to AI service: " + e.getMessage()));
        }
    }
}
