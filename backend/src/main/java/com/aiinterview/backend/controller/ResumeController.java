package com.aiinterview.backend.controller;

import com.aiinterview.backend.entity.Resume;
import com.aiinterview.backend.entity.User;
import com.aiinterview.backend.service.ResumeService;
import com.aiinterview.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    @Autowired
    private ResumeService resumeService;

    @Autowired
    private UserService userService;

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Please select a file to upload");
            return ResponseEntity.badRequest().body(err);
        }

        try {
            User user = getAuthenticatedUser();
            Resume resume = resumeService.saveResume(file, user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Resume uploaded and processed successfully");
            response.put("resumeId", resume.getId());
            response.put("fileName", resume.getFileName());
            response.put("extractedTextPreview", resume.getExtractedText().substring(0, Math.min(resume.getExtractedText().length(), 200)));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Error uploading file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestResume() {
        try {
            User user = getAuthenticatedUser();
            return resumeService.getLatestResume(user)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.noContent().build());
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }
}
