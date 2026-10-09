package com.aiinterview.backend.controller;

import com.aiinterview.backend.entity.Interview;
import com.aiinterview.backend.entity.InterviewQuestion;
import com.aiinterview.backend.entity.User;
import com.aiinterview.backend.service.InterviewService;
import com.aiinterview.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    @Autowired
    private InterviewService interviewService;

    @Autowired
    private UserService userService;

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));
    }

    @PostMapping("/start")
    public ResponseEntity<?> startInterview(@RequestBody Map<String, String> request) {
        String type = request.getOrDefault("type", "HR");
        String subject = request.getOrDefault("subject", "General");
        
        try {
            User user = getAuthenticatedUser();
            Interview interview = interviewService.startInterview(type, subject, user);
            List<InterviewQuestion> questions = interviewService.getInterviewQuestions(interview);
            
            Map<String, Object> response = new HashMap<>();
            response.put("interview", interview);
            response.put("questions", questions);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Error starting interview: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    @PostMapping("/{id}/submit-answer")
    public ResponseEntity<?> submitAnswer(
            @PathVariable("id") Long interviewId,
            @RequestBody Map<String, Object> request) {
        
        try {
            Long questionId = Long.valueOf(request.get("questionId").toString());
            String answer = request.getOrDefault("answer", "").toString();
            
            Double confidence = request.get("confidence") != null 
                    ? Double.valueOf(request.get("confidence").toString()) 
                    : null;
                    
            Double eyeContact = request.get("eyeContact") != null 
                    ? Double.valueOf(request.get("eyeContact").toString()) 
                    : null;

            InterviewQuestion question = interviewService.submitAnswer(questionId, answer, confidence, eyeContact);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Error submitting answer: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeInterview(@PathVariable("id") Long interviewId) {
        try {
            Interview interview = interviewService.completeInterview(interviewId);
            return ResponseEntity.ok(interview);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Error completing interview: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        try {
            User user = getAuthenticatedUser();
            List<Interview> history = interviewService.getHistory(user);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
    e.printStackTrace();

    Map<String, String> err = new HashMap<>();
    err.put("error", "Error fetching history: " + e.getMessage());
    return ResponseEntity.internalServerError().body(err);
        }
    }

    @GetMapping("/{id}/feedback")
    public ResponseEntity<?> getFeedback(@PathVariable("id") Long interviewId) {
        try {
            Interview interview = interviewService.getInterviewById(interviewId)
                    .orElseThrow(() -> new IllegalArgumentException("Interview not found with ID: " + interviewId));
            
            List<InterviewQuestion> questions = interviewService.getInterviewQuestions(interview);
            
            Map<String, Object> response = new HashMap<>();
            response.put("interview", interview);
            response.put("questions", questions);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Error fetching feedback: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }
}
