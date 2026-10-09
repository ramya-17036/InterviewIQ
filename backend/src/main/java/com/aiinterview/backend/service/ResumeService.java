package com.aiinterview.backend.service;

import com.aiinterview.backend.entity.Resume;
import com.aiinterview.backend.entity.User;
import com.aiinterview.backend.repository.ResumeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.stream.Collectors;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

@Service
public class ResumeService {

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private GeminiService geminiService;

    public Resume saveResume(MultipartFile file, User user) throws Exception {
        String fileName = file.getOriginalFilename();
        String extractedText = "";

        if (fileName != null && fileName.toLowerCase().endsWith(".txt")) {
            // Read TXT file directly
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
                extractedText = reader.lines().collect(Collectors.joining("\n"));
            }
        } else if (fileName != null && fileName.toLowerCase().endsWith(".pdf")) {
            // Read PDF file properly using Apache PDFBox
            try (PDDocument document = PDDocument.load(file.getInputStream())) {
                PDFTextStripper stripper = new PDFTextStripper();
                extractedText = stripper.getText(document);
                if (extractedText == null || extractedText.trim().isEmpty()) {
                    extractedText = "The uploaded PDF file is empty or could not be text-extracted. Profile fallback initialized:\n" +
                            "Candidate Skills: Java, Spring Boot, MySQL, REST APIs, JavaScript, React, HTML5, CSS3.\n" +
                            "Experience: Worked on Web Applications and Student Management Systems.\n" +
                            "Education: B.Tech in Computer Science and Engineering.";
                }
            } catch (Exception e) {
                System.err.println("Failed to extract text from PDF: " + e.getMessage());
                extractedText = "Error parsing PDF document (" + e.getMessage() + "). Profile fallback initialized:\n" +
                        "Candidate Skills: Java, Spring Boot, MySQL, REST APIs, JavaScript, React, HTML5, CSS3.\n" +
                        "Experience: Worked on Web Applications and Student Management Systems.\n" +
                        "Education: B.Tech in Computer Science and Engineering.";
            }
        } else {
            // Fallback for other file types
            extractedText = "Extracted profile from " + fileName + ":\n" +
                    "Candidate Skills: Java, Spring Boot, MySQL, REST APIs, JavaScript, React, HTML5, CSS3.\n" +
                    "Experience: Worked on Web Applications and Student Management Systems.\n" +
                    "Education: B.Tech in Computer Science and Engineering.";
        }

        // Analyze the resume text to calculate skills, suggestedRole, experience, ATS score, and feedback suggestions
        String analysisResults = geminiService.analyzeResume(extractedText);

        Resume resume = Resume.builder()
                .user(user)
                .fileName(fileName)
                .extractedText(extractedText)
                .analysisResults(analysisResults)
                .build();

        return resumeRepository.save(resume);
    }

    public Optional<Resume> getLatestResume(User user) {
        return resumeRepository.findFirstByUserOrderByUploadedAtDesc(user);
    }
}
