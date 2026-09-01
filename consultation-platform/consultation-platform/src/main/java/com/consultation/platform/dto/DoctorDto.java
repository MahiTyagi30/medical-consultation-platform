package com.consultation.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DoctorDto {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String specialization;
    private String qualification;
    private Integer experienceYears;
}