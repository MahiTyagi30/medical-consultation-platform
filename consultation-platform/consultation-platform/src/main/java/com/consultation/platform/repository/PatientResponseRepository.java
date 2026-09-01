package com.consultation.platform.repository;

import com.consultation.platform.entity.PatientResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientResponseRepository extends JpaRepository<PatientResponse, Long> {
    List<PatientResponse> findByAssessmentIdOrderByCreatedAtAsc(Long assessmentId);
}