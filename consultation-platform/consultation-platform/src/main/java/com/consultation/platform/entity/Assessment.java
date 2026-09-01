package com.consultation.platform.entity;

import com.consultation.platform.model.ConsultationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "assessments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(columnDefinition = "TEXT")
    private String patientAnswers;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ConsultationStatus status = ConsultationStatus.PENDING_REVIEW;

    @Column(columnDefinition = "TEXT")
    private String doctorNotes;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Explicit Getters to ensure resolution regardless of Lombok processing
    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getSymptoms() { return symptoms; }
    public String getPatientAnswers() { return patientAnswers; }
    public String getAiSummary() { return aiSummary; }
    public ConsultationStatus getStatus() { return status; }
    public String getDoctorNotes() { return doctorNotes; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
    public void setPatientAnswers(String patientAnswers) { this.patientAnswers = patientAnswers; }
    public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }
    public void setStatus(ConsultationStatus status) { this.status = status; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getPrimarySymptoms() {
        return this.symptoms;
    }
}