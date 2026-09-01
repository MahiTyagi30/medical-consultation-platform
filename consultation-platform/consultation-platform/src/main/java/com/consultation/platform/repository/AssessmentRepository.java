package com.consultation.platform.repository;

import com.consultation.platform.entity.Assessment;
import com.consultation.platform.model.ConsultationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {

    List<Assessment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Assessment> findByStatusOrderByCreatedAtDesc(ConsultationStatus status);
}