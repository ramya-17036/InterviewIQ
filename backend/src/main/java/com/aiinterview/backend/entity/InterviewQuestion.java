package com.aiinterview.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "interview_questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @Column(name = "question_text", nullable = false, length = 1000)
    private String questionText;

    @Column(name = "sample_answer", length = 2000)
    private String sampleAnswer;

    @Column(name = "candidate_answer", length = 3000)
    private String candidateAnswer;

    @Column(name = "score")
    private Double score;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "eye_contact_score")
    private Double eyeContactScore;

    @Lob
    @Column(name = "evaluation_feedback", columnDefinition = "TEXT")
    private String evaluationFeedback;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
}
