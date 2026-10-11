package com.example.skillforge.service;

import com.example.skillforge.dto.request.ChatRequest;
import com.example.skillforge.dto.response.ChatResponse;
import com.example.skillforge.model.entity.Course;
import com.example.skillforge.model.entity.Enrollment;
import com.example.skillforge.model.entity.Student;
import com.example.skillforge.model.entity.User;
import com.example.skillforge.repository.EnrollmentRepository;
import com.example.skillforge.repository.StudentRepository;
import com.example.skillforge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private com.example.skillforge.repository.CertificateRepository certificateRepository;

    @Autowired
    private com.example.skillforge.repository.QuizAttemptRepository quizAttemptRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final String PYTHON_SERVICE_URL = "http://localhost:5001/chat";

    @Transactional(readOnly = true)
    public ChatResponse processChat(String email, ChatRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> context = new HashMap<>();
        context.put("role", user.getRole().name());

        if (user.getRole().name().equals("STUDENT")) {
            Student student = studentRepository.findByUserId(user.getId())
                    .orElse(null);

            if (student != null) {
                context.put("studentName", user.getName());
                context.put("studentId", student.getId());

                // 1. Enrolled Courses
                List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
                List<Map<String, Object>> courses = new ArrayList<>();
                List<Long> courseIds = new ArrayList<>();                       // ← RAG: enrolled course IDs
                for (Enrollment enrollment : enrollments) {
                    Map<String, Object> courseInfo = new HashMap<>();
                    Course course = enrollment.getCourse();
                    courseInfo.put("title", course.getTitle());
                    courseInfo.put("progress", enrollment.getCompletionPercentage());
                    courseInfo.put("courseId", course.getId());                // expose courseId for UI
                    courses.add(courseInfo);
                    courseIds.add(course.getId());                              // collect for RAG filter
                }
                context.put("courses", courses);
                context.put("courseIds", courseIds);                           // ← RAG: pass to Flask

                // 2. Recent Quiz Attempts
                List<com.example.skillforge.model.entity.QuizAttempt> attempts = quizAttemptRepository
                        .findRecentAttemptsByStudentId(student.getId());
                List<Map<String, Object>> recentQuizzes = new ArrayList<>();
                int count = 0;
                for (com.example.skillforge.model.entity.QuizAttempt attempt : attempts) {
                    if (count++ >= 5)
                        break;
                    Map<String, Object> quizInfo = new HashMap<>();
                    quizInfo.put("quizTitle", attempt.getQuiz().getTitle());
                    quizInfo.put("score", attempt.getScore());
                    // Assuming 50% is passing score if not defined
                    quizInfo.put("passed", attempt.getScore() != null && attempt.getScore() >= 50.0);
                    recentQuizzes.add(quizInfo);
                }
                context.put("recentQuizzes", recentQuizzes);

                // 3. Certificates
                List<com.example.skillforge.model.entity.Certificate> certificates = certificateRepository
                        .findByStudentId(student.getId());
                List<Map<String, Object>> certs = new ArrayList<>();
                for (com.example.skillforge.model.entity.Certificate cert : certificates) {
                    Map<String, Object> certInfo = new HashMap<>();
                    certInfo.put("courseTitle", cert.getCourse().getTitle());
                    certInfo.put("issueDate", cert.getIssuedAt() != null ? cert.getIssuedAt().toString() : "N/A");
                    certs.add(certInfo);
                }
                context.put("certificates", certs);
            }
        }

        // Prepare payload for Python service
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", request.getMessage());
        payload.put("context", context);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            // Call Python RAG service
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(PYTHON_SERVICE_URL, entity, Map.class);

            if (response != null && response.containsKey("response")) {
                String aiText = (String) response.get("response");

                // Extract RAG metadata from response
                @SuppressWarnings("unchecked")
                java.util.List<String> sources =
                        response.get("sources") instanceof java.util.List
                        ? (java.util.List<String>) response.get("sources")
                        : java.util.List.of();

                boolean ragUsed = Boolean.TRUE.equals(response.get("ragUsed"));

                return new ChatResponse(aiText, sources, ragUsed);
            } else {
                return new ChatResponse("I am having trouble connecting to my brain right now.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ChatResponse("Sorry, I am currently unavailable. Please try again later.");
        }
    }

    @Transactional(readOnly = true)
    public ChatResponse processChatMultipart(String email, String message, org.springframework.web.multipart.MultipartFile[] files) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> context = new HashMap<>();
        context.put("role", user.getRole().name());

        if (user.getRole().name().equals("STUDENT")) {
            Student student = studentRepository.findByUserId(user.getId())
                    .orElse(null);

            if (student != null) {
                context.put("studentName", user.getName());
                context.put("studentId", student.getId());

                List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
                List<Map<String, Object>> courses = new ArrayList<>();
                List<Long> courseIds = new ArrayList<>();
                for (Enrollment enrollment : enrollments) {
                    Map<String, Object> courseInfo = new HashMap<>();
                    Course course = enrollment.getCourse();
                    courseInfo.put("title", course.getTitle());
                    courseInfo.put("progress", enrollment.getCompletionPercentage());
                    courseInfo.put("courseId", course.getId());
                    courses.add(courseInfo);
                    courseIds.add(course.getId());
                }
                context.put("courses", courses);
                context.put("courseIds", courseIds);

                List<com.example.skillforge.model.entity.QuizAttempt> attempts = quizAttemptRepository
                        .findRecentAttemptsByStudentId(student.getId());
                List<Map<String, Object>> recentQuizzes = new ArrayList<>();
                int count = 0;
                for (com.example.skillforge.model.entity.QuizAttempt attempt : attempts) {
                    if (count++ >= 5)
                        break;
                    Map<String, Object> quizInfo = new HashMap<>();
                    quizInfo.put("quizTitle", attempt.getQuiz().getTitle());
                    quizInfo.put("score", attempt.getScore());
                    quizInfo.put("passed", attempt.getScore() != null && attempt.getScore() >= 50.0);
                    recentQuizzes.add(quizInfo);
                }
                context.put("recentQuizzes", recentQuizzes);

                List<com.example.skillforge.model.entity.Certificate> certificates = certificateRepository
                        .findByStudentId(student.getId());
                List<Map<String, Object>> certs = new ArrayList<>();
                for (com.example.skillforge.model.entity.Certificate cert : certificates) {
                    Map<String, Object> certInfo = new HashMap<>();
                    certInfo.put("courseTitle", cert.getCourse().getTitle());
                    certInfo.put("issueDate", cert.getIssuedAt() != null ? cert.getIssuedAt().toString() : "N/A");
                    certs.add(certInfo);
                }
                context.put("certificates", certs);
            }
        }

        // Prepare Multipart payload for Python service
        org.springframework.util.MultiValueMap<String, Object> payload = new org.springframework.util.LinkedMultiValueMap<>();
        payload.add("message", message);
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String contextJson = mapper.writeValueAsString(context);
            payload.add("context", contextJson);
        } catch (Exception e) {
            e.printStackTrace();
            payload.add("context", "{}");
        }

        if (files != null) {
            for (org.springframework.web.multipart.MultipartFile file : files) {
                if (!file.isEmpty()) {
                    try {
                        org.springframework.core.io.ByteArrayResource fileResource = new org.springframework.core.io.ByteArrayResource(file.getBytes()) {
                            @Override
                            public String getFilename() {
                                return file.getOriginalFilename();
                            }
                        };
                        payload.add("files", fileResource);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<org.springframework.util.MultiValueMap<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(PYTHON_SERVICE_URL, entity, Map.class);

            if (response != null && response.containsKey("response")) {
                String aiText = (String) response.get("response");
                
                @SuppressWarnings("unchecked")
                java.util.List<String> sources =
                        response.get("sources") instanceof java.util.List
                        ? (java.util.List<String>) response.get("sources")
                        : java.util.List.of();

                boolean ragUsed = Boolean.TRUE.equals(response.get("ragUsed"));

                return new ChatResponse(aiText, sources, ragUsed);
            } else {
                return new ChatResponse("I am having trouble connecting to my brain right now.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ChatResponse("Sorry, I am currently unavailable. Please try again later.");
        }
    }
}
