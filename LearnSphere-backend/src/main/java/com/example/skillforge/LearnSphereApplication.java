// Author: Ganesh S
// LearnSphere-Platform – AI-Driven Adaptive Learning and Exam Generator
// Individual Portfolio Project

package com.example.skillforge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync   // enables @Async for non-blocking RAG ingestion
public class LearnSphereApplication {

        public static void main(String[] args) {

                SpringApplication.run(LearnSphereApplication.class, args);
                System.out.println("\n========================================");
                System.out.println("✅ LearnSphere-Platform Backend Started Successfully!");
                System.out.println("🚀 Server running on: http://localhost:8080");
                System.out.println("📚 API Docs: http://localhost:8080/api/health");
                System.out.println("========================================\n");

        }

}
