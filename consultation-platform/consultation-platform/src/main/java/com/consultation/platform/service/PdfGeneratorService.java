package com.consultation.platform.service;

import com.consultation.platform.entity.Assessment;
import com.consultation.platform.repository.AssessmentRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfGeneratorService {

    @Autowired
    private AssessmentRepository assessmentRepository;

    public ByteArrayInputStream generateDoctorReportPdf(Long assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment record not found with ID: " + assessmentId));

        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
            Font sectionHeadingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLUE);
            Font tableLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.BLACK);
            Font tableValueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.DARK_GRAY);

            // 1. Title
            Paragraph title = new Paragraph("CLINICAL VOICE INTAKE REPORT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            // 2. Metadata Table
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);

            String formattedDate = assessment.getCreatedAt() != null
                    ? assessment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                    : "N/A";

            String symptomsText = assessment.getSymptoms() != null ? assessment.getSymptoms() : "Not reported";

            addTableCell(metaTable, "Assessment ID:", tableLabelFont, true);
            addTableCell(metaTable, "#INT-" + assessment.getId(), tableValueFont, false);

            addTableCell(metaTable, "Date:", tableLabelFont, true);
            addTableCell(metaTable, formattedDate, tableValueFont, false);

            addTableCell(metaTable, "Primary Symptom:", tableLabelFont, true);
            addTableCell(metaTable, symptomsText, tableValueFont, false);

            addTableCell(metaTable, "Status:", tableLabelFont, true);
            addTableCell(metaTable, assessment.getStatus() != null ? assessment.getStatus().name() : "PENDING_REVIEW", tableValueFont, false);

            metaTable.setSpacingAfter(20);
            document.add(metaTable);

            // 3. AI Clinical Summary Section
            addSectionHeader(document, "1. AI CLINICAL SUMMARY", sectionHeadingFont);
            Paragraph summaryPara = new Paragraph(
                    assessment.getAiSummary() != null ? assessment.getAiSummary() : "No summary available.",
                    tableValueFont
            );
            summaryPara.setSpacingAfter(15);
            document.add(summaryPara);

            // 4. Patient Voice Answers Section
            if (assessment.getPatientAnswers() != null && !assessment.getPatientAnswers().isBlank()) {
                addSectionHeader(document, "2. PATIENT INTAKE TRANSCRIPT", sectionHeadingFont);
                Paragraph answersPara = new Paragraph(assessment.getPatientAnswers(), tableValueFont);
                answersPara.setSpacingAfter(15);
                document.add(answersPara);
            }

            // 5. Doctor Notes (if present)
            // 5. Doctor Notes (if present)
            if (assessment.getDoctorNotes() != null && !assessment.getDoctorNotes().isBlank()) {
                addSectionHeader(document, "3. DOCTOR REVIEW & NOTES", sectionHeadingFont);
                Paragraph notesPara = new Paragraph(assessment.getDoctorNotes(), tableValueFont);
                notesPara.setSpacingAfter(15);
                document.add(notesPara);
            }

            document.close();

        } catch (DocumentException ex) {
            throw new RuntimeException("Error generating PDF: " + ex.getMessage(), ex);
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private void addSectionHeader(Document document, String headingText, Font font) throws DocumentException {
        Paragraph header = new Paragraph(headingText, font);
        header.setSpacingBefore(10);
        header.setSpacingAfter(5);
        document.add(header);
    }

    private void addTableCell(PdfPTable table, String text, Font font, boolean isLabel) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(6);
        if (isLabel) {
            cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        }
        table.addCell(cell);
    }
}