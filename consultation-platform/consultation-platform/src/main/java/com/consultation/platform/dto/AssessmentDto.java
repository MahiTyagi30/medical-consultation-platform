package com.consultation.platform.dto;

import com.consultation.platform.model.ConsultationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentDto {
    private Long id;
    private Long userId;
    private String symptoms;
    private String patientAnswers;
    private String aiSummary;
    private ConsultationStatus status;
    private String doctorNotes;
    private LocalDateTime createdAt;
}