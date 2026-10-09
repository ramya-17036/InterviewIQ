package com.aiinterview.backend.repository;

import com.aiinterview.backend.entity.Resume;
import com.aiinterview.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByUser(User user);
    Optional<Resume> findFirstByUserOrderByUploadedAtDesc(User user);
}
