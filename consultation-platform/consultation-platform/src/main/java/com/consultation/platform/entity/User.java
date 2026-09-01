package com.consultation.platform.entity;

import com.consultation.platform.model.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    // Populated to satisfy existing MySQL database constraints
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    private Integer age;
    private String gender;
    private String bloodGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public User(String email, String password, String fullName, Role role) {
        this.email = email;
        this.username = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.createdAt = LocalDateTime.now();
    }

    public String getName() {
        return this.fullName;
    }

    public void setName(String name) {
        this.fullName = name;
    }

    public String getUsername() {
        return this.username != null ? this.username : this.email;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}