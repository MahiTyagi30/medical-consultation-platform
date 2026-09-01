package com.consultation.platform.controller;

import com.consultation.platform.dto.AssessmentDto;
import com.consultation.platform.model.ConsultationStatus;
import com.consultation.platform.service.AssessmentService;
import com.consultation.platform.service.OpenAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assessments")
@CrossOrigin(origins = "*")
public class AssessmentController {

    private final AssessmentService assessmentService;
    private final OpenAiService openAiService;


    @Autowired
    public AssessmentController(AssessmentService assessmentService, OpenAiService openAiService) {
        this.assessmentService = assessmentService;
        this.openAiService = openAiService;
    }




    @PostMapping("/next-question")
    public ResponseEntity<Map<String, Object>> getNextQuestion(@RequestBody List<Map<String, String>> history) {
        Map<String, Object> response = new HashMap<>();
        try {
            String question = openAiService.generateFollowUpQuestion(history);
            boolean isComplete = "[COMPLETE]".equalsIgnoreCase(question.trim())
                    || question.toUpperCase().contains("[COMPLETE]")
                    || (history != null && history.size() >= 10);

            if (isComplete) {
                response.put("nextQuestion", "Thank you. Your medical assessment is now complete.");
                response.put("question", "Thank you. Your medical assessment is now complete.");
                response.put("isComplete", true);
            } else {
                response.put("nextQuestion", question);
                response.put("question", question);
                response.put("isComplete", false);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("nextQuestion", "Could you tell me how long you have experienced these symptoms?");
            response.put("question", "Could you tell me how long you have experienced these symptoms?");
            response.put("isComplete", false);
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/summary")
    public ResponseEntity<Map<String, String>> generateSummary(@RequestBody Map<String, String> payload) {
        String symptoms = payload.getOrDefault("symptoms", "");
        String answers = payload.getOrDefault("answers", "");
        String summary = openAiService.generateClinicalSummary(symptoms, answers);
        return ResponseEntity.ok(Map.of("summary", summary));
    }

    @PostMapping
    public ResponseEntity<AssessmentDto> saveAssessment(@RequestBody Map<String, String> payload, Authentication authentication) {
        String email = authentication.getName();
        String symptoms = payload.getOrDefault("symptoms", "");
        String answers = payload.getOrDefault("answers", "");
        String summary = payload.getOrDefault("aiSummary", "");

        AssessmentDto dto = assessmentService.saveAssessment(email, symptoms, answers, summary);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/my-history")
    public ResponseEntity<List<AssessmentDto>> getMyHistory(Authentication authentication) {
        String email = authentication.getName();
        List<AssessmentDto> history = assessmentService.getUserConsultationHistory(email);
        return ResponseEntity.ok(history);
    }

    // ============================================================
    // DOCTOR PORTAL ENDPOINTS
    // ============================================================

    @GetMapping("/doctor/all")
    public ResponseEntity<List<AssessmentDto>> getAllAssessmentsForDoctor() {
        List<AssessmentDto> allAssessments = assessmentService.getAllAssessments();
        return ResponseEntity.ok(allAssessments);
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<AssessmentDto> reviewAssessment(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {

        String doctorNotes = payload.getOrDefault("doctorNotes", "");
        String statusStr = payload.getOrDefault("status", "REVIEWED");

        ConsultationStatus status = ConsultationStatus.valueOf(statusStr.toUpperCase());
        AssessmentDto updated = assessmentService.updateDoctorReview(id, doctorNotes, status);

        return ResponseEntity.ok(updated);
    }
}

