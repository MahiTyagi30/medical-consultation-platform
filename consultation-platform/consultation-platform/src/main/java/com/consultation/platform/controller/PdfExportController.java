package com.consultation.platform.controller;

import com.consultation.platform.entity.Assessment;
import com.consultation.platform.service.AssessmentService;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PdfExportController {

    private final AssessmentService assessmentService;

    @GetMapping({"/pdf/export/{id}", "/assessments/{id}/pdf"})
    public ResponseEntity<byte[]> generateAssessmentPdf(@PathVariable Long id) {
        Assessment assessment = assessmentService.getAssessmentById(id);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);

            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            document.add(new Paragraph("CLINICAL VOICE INTAKE PRE-ASSESSMENT REPORT\n\n", titleFont));
            document.add(new Paragraph("Patient ID: " + assessment.getUser().getId(), headerFont));
            document.add(new Paragraph("Date: " + assessment.getCreatedAt(), bodyFont));
            document.add(new Paragraph("Status: " + assessment.getStatus(), bodyFont));
            document.add(new Paragraph("\n--------------------------------------------------\n", bodyFont));

            document.add(new Paragraph("Chief Symptoms:\n", headerFont));
            document.add(new Paragraph(assessment.getSymptoms() != null ? assessment.getSymptoms() : "N/A", bodyFont));

            document.add(new Paragraph("\nAI Clinical Summary:\n", headerFont));
            document.add(new Paragraph(assessment.getAiSummary() != null ? assessment.getAiSummary() : "N/A", bodyFont));

            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Clinical_Report_" + id + ".pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(out.toByteArray());

        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF: " + e.getMessage());
        }
    }
}