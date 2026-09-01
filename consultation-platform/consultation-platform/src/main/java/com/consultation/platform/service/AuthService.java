package com.consultation.platform.service;

import com.consultation.platform.dto.AuthResponse;
import com.consultation.platform.dto.LoginRequest;
import com.consultation.platform.dto.RegisterRequest;
import com.consultation.platform.entity.Doctor;
import com.consultation.platform.entity.Patient;
import com.consultation.platform.entity.User;
import com.consultation.platform.model.Role;
import com.consultation.platform.repository.DoctorRepository;
import com.consultation.platform.repository.PatientRepository;
import com.consultation.platform.repository.UserRepository;
import com.consultation.platform.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @Autowired
    public AuthService(UserRepository userRepository,
                       PatientRepository patientRepository,
                       DoctorRepository doctorRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RuntimeException("Email cannot be empty.");
        }

        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        Role userRole = Role.ROLE_PATIENT;
        if (request.getRole() != null) {
            String roleStr = request.getRole().toString();
            if (roleStr.contains("DOCTOR")) {
                userRole = Role.ROLE_DOCTOR;
            }
        }

        String displayName = (request.getName() != null && !request.getName().isBlank())
                ? request.getName().trim()
                : request.getEmail().trim();

        User user = User.builder()
                .fullName(displayName)
                .email(request.getEmail().trim())
                .username(request.getEmail().trim()) // Satisfies database username requirement
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .build();

        User savedUser = userRepository.save(user);

        if (userRole == Role.ROLE_PATIENT) {
            Patient.Gender genderEnum = parseGender(request.getGender());

            Patient patient = Patient.builder()
                    .user(savedUser)
                    .dateOfBirth(request.getDob())
                    .gender(genderEnum)
                    .medicalHistory(request.getMedicalHistory() != null ? request.getMedicalHistory() : "")
                    .build();
            patientRepository.save(patient);
        } else if (userRole == Role.ROLE_DOCTOR) {
            Doctor doctor = Doctor.builder()
                    .user(savedUser)
                    .specialization(request.getSpecialization() != null ? request.getSpecialization() : "General")
                    .qualification(request.getQualification() != null ? request.getQualification() : "MBBS")
                    .experienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0)
                    .build();
            doctorRepository.save(doctor);
        }

        String token = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .name(savedUser.getName())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .name(user.getName())
                .build();
    }

    private Patient.Gender parseGender(String genderStr) {
        if (genderStr == null || genderStr.trim().isEmpty()) {
            return Patient.Gender.FEMALE;
        }
        try {
            return Patient.Gender.valueOf(genderStr.trim().toUpperCase());
        } catch (Exception e) {
            return Patient.Gender.FEMALE;
        }
    }
}