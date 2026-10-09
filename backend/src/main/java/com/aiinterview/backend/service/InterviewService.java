package com.aiinterview.backend.service;

import com.aiinterview.backend.entity.*;
import com.aiinterview.backend.repository.InterviewQuestionRepository;
import com.aiinterview.backend.repository.InterviewRepository;
import com.aiinterview.backend.repository.ResumeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class InterviewService {

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private InterviewQuestionRepository interviewQuestionRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private GeminiService geminiService;

    @Transactional
    public Interview startInterview(String type, String subject, User user) {
        // Fetch latest resume if available
        Optional<Resume> resumeOpt = resumeRepository.findFirstByUserOrderByUploadedAtDesc(user);
        String resumeText = resumeOpt.map(Resume::getExtractedText).orElse(null);

        // Generate questions (default to 5 questions)
        int questionCount = 5;
        List<String> questionTexts = geminiService.generateQuestions(type, subject, resumeText, user.getTargetCompany(), questionCount);

        // Save Interview Session
        Interview interview = Interview.builder()
                .user(user)
                .type(type)
                .subject(subject)
                .status("STARTED")
                .createdAt(LocalDateTime.now())
                .build();

        Interview savedInterview = interviewRepository.save(interview);

        // Save individual questions
        for (int i = 0; i < questionTexts.size(); i++) {
            InterviewQuestion q = InterviewQuestion.builder()
                    .interview(savedInterview)
                    .questionText(questionTexts.get(i))
                    .displayOrder(i + 1)
                    .build();
            interviewQuestionRepository.save(q);
        }

        return savedInterview;
    }

    @Transactional
    public InterviewQuestion submitAnswer(Long questionId, String answer, Double confidence, Double eyeContact) {
        InterviewQuestion q = interviewQuestionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found with ID: " + questionId));

        // Evaluate using Gemini Service
        Map<String, Object> eval = geminiService.evaluateAnswer(q.getQuestionText(), answer);

        q.setCandidateAnswer(answer);
        q.setScore((Double) eval.get("score"));
        
        // Use client-side webcam metrics if provided (e.g. from OpenCV/MediaPipe), or fallback to AI-assessed ones
        q.setConfidenceScore(confidence != null ? confidence : (Double) eval.get("confidenceScore"));
        q.setEyeContactScore(eyeContact != null ? eyeContact : (Double) eval.get("eyeContactScore"));
        q.setEvaluationFeedback((String) eval.get("feedback"));

        return interviewQuestionRepository.save(q);
    }

    @Transactional
    public Interview completeInterview(Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found with ID: " + interviewId));

        List<InterviewQuestion> questions = interviewQuestionRepository.findByInterviewOrderByDisplayOrderAsc(interview);

        double totalScore = 0.0;
        double totalConfidence = 0.0;
        double totalEyeContact = 0.0;
        int count = 0;

        for (InterviewQuestion q : questions) {
            
if (q.getScore() != null) {
    totalScore += q.getScore();

    totalConfidence += q.getConfidenceScore() != null
            ? q.getConfidenceScore() : 0.0;

    totalEyeContact += q.getEyeContactScore() != null
            ? q.getEyeContactScore() : 0.0;

    count++;
}

        }

        if (count > 0) {
            double avgScore = totalScore / count;
            double avgConfidence = totalConfidence / count;
            double avgEyeContact = totalEyeContact / count;

            // Map standard dimensions
            interview.setOverallScore(Math.round(avgScore * 10.0) / 10.0);
            interview.setConfidenceScore(Math.round(avgConfidence * 10.0) / 10.0);
            interview.setEyeContactScore(Math.round(avgEyeContact * 10.0) / 10.0);
            
            // Communication score can be modeled on combination of content + confidence
            double commScore = (avgScore + avgConfidence) / 2.0;
            interview.setCommunicationScore(Math.round(commScore * 10.0) / 10.0);

            // Technical score maps directly to domain logic accuracy
            interview.setTechnicalScore(Math.round(avgScore * 10.0) / 10.0);

            // Construct brief overall suggestion
            String feedbackSummary;
            if (avgScore >= 8.0) {
                feedbackSummary = "Excellent performance! You exhibited superb technical proficiency, clear verbal communication, and stable facial confidence. To stand out further, polish edge-case answers and continue practicing mock coding questions.";
            } else if (avgScore >= 6.0) {
                feedbackSummary = "Good job. You have a solid grasp of core fundamentals but struggle a bit with structuring complete answers. Focus on expanding technical answers with structured examples and maintain steady eye contact during high-pressure queries.";
            } else {
                feedbackSummary = "Needs practice. Work on reviewing technical study materials, speaking clearly, and practicing body language. Utilize the STAR framework to build structured, comprehensive responses.";
            }
            interview.setFeedback(feedbackSummary);
        } else {
            // Unanswered interview
            interview.setOverallScore(0.0);
            interview.setConfidenceScore(0.0);
            interview.setEyeContactScore(0.0);
            interview.setCommunicationScore(0.0);
            interview.setTechnicalScore(0.0);
            interview.setFeedback("Interview completed with no answers recorded.");
        }

        interview.setStatus("COMPLETED");
        return interviewRepository.save(interview);
    }

    public List<Interview> getHistory(User user) {
        return interviewRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Optional<Interview> getInterviewById(Long id) {
        return interviewRepository.findById(id);
    }

    public List<InterviewQuestion> getInterviewQuestions(Interview interview) {
        return interviewQuestionRepository.findByInterviewOrderByDisplayOrderAsc(interview);
    }
}
