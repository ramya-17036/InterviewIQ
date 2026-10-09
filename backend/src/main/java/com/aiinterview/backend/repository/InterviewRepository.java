package com.aiinterview.backend.repository;

import com.aiinterview.backend.entity.Interview;
import com.aiinterview.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByUserOrderByCreatedAtDesc(User user);
}
