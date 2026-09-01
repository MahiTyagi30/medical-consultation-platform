package com.consultation.platform.repository;

import com.consultation.platform.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    Optional<Prescription> findByAppointmentId(Long appointmentId);
}