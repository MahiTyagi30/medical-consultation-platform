package com.consultation.platform.service;

import com.consultation.platform.dto.AppointmentRequest;
import com.consultation.platform.dto.AppointmentResponse;
import com.consultation.platform.dto.DoctorDto;
import com.consultation.platform.entity.*;
import com.consultation.platform.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              PatientRepository patientRepository,
                              DoctorRepository doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public List<DoctorDto> getAllDoctors() {
        return doctorRepository.findAll().stream().map(doc -> DoctorDto.builder()
                .id(doc.getId())
                .userId(doc.getUser().getId())
                .name(doc.getUser() != null ? doc.getUser().getName() : "N/A")
                .email(doc.getUser() != null ? doc.getUser().getEmail() : "N/A")
                .specialization(doc.getSpecialization())
                .qualification(doc.getQualification())
                .experienceYears(doc.getExperienceYears())
                .build()
        ).collect(Collectors.toList());
    }

    public AppointmentResponse bookAppointment(AppointmentRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .status(Appointment.Status.SCHEDULED)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        return mapToResponse(saved);
    }

    public List<AppointmentResponse> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponse> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AppointmentResponse mapToResponse(Appointment appointment) {
        String patientName = (appointment.getPatient() != null && appointment.getPatient().getUser() != null)
                ? appointment.getPatient().getUser().getName()
                : "N/A";

        String doctorName = (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null)
                ? appointment.getDoctor().getUser().getName()
                : "N/A";

        String specialization = appointment.getDoctor() != null
                ? appointment.getDoctor().getSpecialization()
                : "N/A";

        return AppointmentResponse.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatient() != null ? appointment.getPatient().getId() : null)
                .patientName(patientName)
                .doctorId(appointment.getDoctor() != null ? appointment.getDoctor().getId() : null)
                .doctorName(doctorName)
                .doctorSpecialization(specialization)
                .appointmentDate(appointment.getAppointmentDate())
                .status(appointment.getStatus())
                .build();
    }
}