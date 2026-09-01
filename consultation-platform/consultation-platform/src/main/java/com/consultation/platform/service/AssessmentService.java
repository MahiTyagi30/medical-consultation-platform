package com.consultation.platform.service;

import com.consultation.platform.dto.AssessmentDto;
import com.consultation.platform.entity.Assessment;
import com.consultation.platform.entity.User;
import com.consultation.platform.model.ConsultationStatus;
import com.consultation.platform.repository.AssessmentRepository;
import com.consultation.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final UserRepository userRepository;

    @Autowired
    public AssessmentService(AssessmentRepository assessmentRepository, UserRepository userRepository) {
        this.assessmentRepository = assessmentRepository;
        this.userRepository = userRepository;
    }

    public AssessmentDto saveAssessment(String userEmail, String symptoms, String patientAnswers, String aiSummary) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Assessment assessment = Assessment.builder()
                .user(user)
                .symptoms(symptoms)
                .patientAnswers(patientAnswers)
                .aiSummary(aiSummary)
                .status(ConsultationStatus.PENDING_REVIEW)
                .createdAt(LocalDateTime.now())
                .build();

        Assessment saved = assessmentRepository.save(assessment);
        return mapToDto(saved);
    }
    public List<AssessmentDto> getAllAssessments() {
        return assessmentRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public AssessmentDto updateDoctorReview(Long id, String doctorNotes, ConsultationStatus status) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assessment not found with ID: " + id));

        assessment.setDoctorNotes(doctorNotes);
        assessment.setStatus(status);

        Assessment updated = assessmentRepository.save(assessment);
        return mapToDto(updated);
    }

    public List<AssessmentDto> getUserConsultationHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        return assessmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // Fetches the raw Assessment entity required by PDF Export
    public Assessment getAssessmentById(Long id) {
        return assessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assessment record not found with ID: " + id));
    }

    private AssessmentDto mapToDto(Assessment assessment) {
        return AssessmentDto.builder()
                .id(assessment.getId())
                .userId(assessment.getUser().getId())
                .symptoms(assessment.getSymptoms())
                .patientAnswers(assessment.getPatientAnswers())
                .aiSummary(assessment.getAiSummary())
                .status(assessment.getStatus())
                .doctorNotes(assessment.getDoctorNotes())
                .createdAt(assessment.getCreatedAt())
                .build();
    }
}