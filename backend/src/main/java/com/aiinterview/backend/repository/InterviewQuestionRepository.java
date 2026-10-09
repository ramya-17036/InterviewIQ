package com.aiinterview.backend.repository;

import com.aiinterview.backend.entity.Interview;
import com.aiinterview.backend.entity.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findByInterviewOrderByDisplayOrderAsc(Interview interview);
}
