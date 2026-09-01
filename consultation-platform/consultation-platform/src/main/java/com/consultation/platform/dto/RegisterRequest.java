package com.consultation.platform.dto;

import com.consultation.platform.model.Role;

import java.time.LocalDate;

public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private Role role;

    private LocalDate dob;
    private String gender;
    private String medicalHistory;

    private String specialization;
    private String qualification;
    private Integer experienceYears;

    public RegisterRequest() {}

    public RegisterRequest(String name, String email, String password, Role role, LocalDate dob, String gender, String medicalHistory, String specialization, String qualification, Integer experienceYears) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.dob = dob;
        this.gender = gender;
        this.medicalHistory = medicalHistory;
        this.specialization = specialization;
        this.qualification = qualification;
        this.experienceYears = experienceYears;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getMedicalHistory() { return medicalHistory; }
    public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
}