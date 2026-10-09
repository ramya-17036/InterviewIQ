package com.aiinterview.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String type; // HR, TECHNICAL, CODING, APTITUDE

    @Column
    private String subject; // e.g., "Java Developer", "General HR"

    @Column(nullable = false)
    private String status; // STARTED, COMPLETED

    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "eye_contact_score")
    private Double eyeContactScore;

    @Column(name = "communication_score")
    private Double communicationScore;

    @Column(name = "technical_score")
    private Double technicalScore;

    @Lob
    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "STARTED";
        }
    }
}
