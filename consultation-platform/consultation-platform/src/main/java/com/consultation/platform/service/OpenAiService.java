package com.consultation.platform.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiService {

    @Value("${openrouter.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // OpenRouter OpenAI-Compatible Chat Completions Endpoint
    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    // Dynamic Free Models Router (auto-selects active free model)
    private static final String MODEL_ID = "openrouter/free";

    // ============================================================
    // GENERATE FOLLOW-UP QUESTION
    // ============================================================

    public String generateFollowUpQuestion(List<Map<String, String>> conversationHistory) {

        String cleanKey = apiKey != null ? apiKey.trim() : "";

        if (cleanKey.isBlank()) {
            System.err.println("⚠️ OpenRouter API key is missing in application.properties. Using local intelligent fallback.");
            return getFallbackFollowUpQuestion(conversationHistory);
        }

        System.out.println("--------------------------------------------");
        System.out.println("OpenRouter API Key Configured: true");
        System.out.println("Model ID: " + MODEL_ID);
        System.out.println("--------------------------------------------");

        List<Map<String, String>> messages = new ArrayList<>();

        // 1. SYSTEM PROMPT
        Map<String, String> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", """
                You are an AI medical intake assistant.
                Your job is to collect information from a patient before their consultation with a doctor.

                IMPORTANT:
                - You are NOT a doctor.
                - Do NOT diagnose the patient.
                - Do NOT prescribe medication.
                - Do NOT recommend treatment.
                - Your job is only to collect information.

                Based on the complete conversation below, identify the most important information that is still missing and ask exactly ONE follow-up question.

                RULES:
                1. Ask exactly ONE question.
                2. Keep the question concise and easy to understand.
                3. Do NOT ask a question that has already been asked.
                4. Do NOT ask something the patient has already answered.
                5. The next question must depend on the patient's symptoms.
                6. Do NOT ask irrelevant generic questions.
                7. Speak directly to the patient.
                8. Do not diagnose the patient.
                9. If the patient says "no", "nothing", "done", "that's all", "complete", or indicates they have no additional information, return exactly:
                [COMPLETE]

                When relevant, consider:
                - Main complaint, Location, Duration, Onset, Severity, Frequency, Nature of the symptom, Associated symptoms, What makes it better or worse, Previous similar episodes, Existing medical conditions, Current medications, Allergies.

                Ask the MOST RELEVANT missing question.
                Return ONLY the question. Do not provide explanations.
                """);
        messages.add(systemMessage);

        // 2. CONVERSATION HISTORY
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            for (Map<String, String> entry : conversationHistory) {
                if (entry == null) continue;

                String role = entry.getOrDefault("role", "user");
                String text = entry.getOrDefault("text", "");

                if (text == null || text.trim().isEmpty()) continue;

                Map<String, String> msg = new HashMap<>();
                if ("ai".equalsIgnoreCase(role) || "assistant".equalsIgnoreCase(role) || "model".equalsIgnoreCase(role)) {
                    msg.put("role", "assistant");
                } else {
                    msg.put("role", "user");
                }
                msg.put("content", text.trim());
                messages.add(msg);
            }
        }

        // 3. REQUEST BODY
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL_ID);
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.2);

        // 4. HTTP HEADERS
        HttpHeaders headers = createOpenRouterHeaders(cleanKey);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        // 5. CALL OPENROUTER API WITH FALLBACK PROTECTION
        try {
            System.out.println("Calling OpenRouter API...");
            ResponseEntity<Map> response = restTemplate.postForEntity(OPENROUTER_API_URL, requestEntity, Map.class);
            String content = extractResponseContent(response);
            System.out.println("OpenRouter generated question: " + content);
            return content;
        } catch (HttpClientErrorException.TooManyRequests e) {
            System.err.println("⚠️ OpenRouter Rate limit hit. Returning fallback question.");
            return getFallbackFollowUpQuestion(conversationHistory);
        } catch (HttpClientErrorException e) {
            System.err.println("============================================");
            System.err.println("OPENROUTER CLIENT ERROR: " + e.getStatusCode());
            System.err.println("Response: " + e.getResponseBodyAsString());
            System.err.println("============================================");
            return getFallbackFollowUpQuestion(conversationHistory);
        } catch (HttpServerErrorException e) {
            System.err.println("OPENROUTER SERVER ERROR: " + e.getStatusCode());
            return getFallbackFollowUpQuestion(conversationHistory);
        } catch (Exception e) {
            System.err.println("OPENROUTER EXCEPTION: " + e.getMessage());
            return getFallbackFollowUpQuestion(conversationHistory);
        }
    }

    // ============================================================
    // GENERATE CLINICAL SUMMARY
    // ============================================================

    public String generateClinicalSummary(String symptoms, String patientAnswers) {

        String cleanKey = apiKey != null ? apiKey.trim() : "";

        if (cleanKey.isBlank()) {
            System.err.println("⚠️ OpenRouter API key is missing. Returning local template summary.");
            return buildFallbackSummary(symptoms, patientAnswers);
        }

        String systemPrompt = """
                You are an AI clinical documentation assistant.
                Your job is to summarize the patient's information for a doctor before a medical consultation.

                IMPORTANT SAFETY RULES:
                - Do NOT diagnose the patient.
                - Do NOT suggest possible diagnoses.
                - Do NOT prescribe medication.
                - Do NOT recommend treatment.
                - Do NOT invent information.
                - Use only information explicitly provided by the patient.
                - If information is unavailable, write "Not reported".
                - Preserve uncertainty when the patient's speech is unclear.
                - Do not convert uncertain information into a definite medical fact.

                Format the response EXACTLY as follows:

                CHIEF COMPLAINT:
                [Short summary of the main complaint]

                HISTORY OF PRESENT ILLNESS & TIMELINE:
                - Onset: [When/how it started]
                - Duration: [How long it has been present]
                - Severity: [Severity if reported]
                - Progression: [How it has changed]
                - Functional impact: [Effect on walking, movement, daily activities, etc.]

                ASSOCIATED SYMPTOMS:
                - [Reported associated symptoms]
                - [Relevant symptoms specifically denied by the patient]
                
                PREVIOUS CONDITIONS & MEDICATIONS:
                [Information explicitly reported by the patient]

                ALLERGIES:
                [Information explicitly reported by the patient]

                IMPORTANT INFORMATION FOR DOCTOR:
                - [Important clinical information]
                - [Important severity or functional limitations]
                - [Other information the doctor should review]

                Do NOT include a diagnosis section.
                """;

        String userPrompt = "PATIENT'S INITIAL SYMPTOMS:\n" + safeText(symptoms) + "\n\nPATIENT TRANSCRIPT:\n" + safeText(patientAnswers);

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        );

        Map<String, Object> requestBody = Map.of(
                "model", MODEL_ID,
                "messages", messages,
                "temperature", 0.1
        );

        HttpHeaders headers = createOpenRouterHeaders(cleanKey);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        try {
            System.out.println("Calling OpenRouter for clinical summary...");
            ResponseEntity<Map> response = restTemplate.postForEntity(OPENROUTER_API_URL, requestEntity, Map.class);
            return extractResponseContent(response);
        } catch (Exception e) {
            System.err.println("OPENROUTER SUMMARY EXCEPTION: " + e.getMessage() + ". Using fallback template.");
            return buildFallbackSummary(symptoms, patientAnswers);
        }
    }

    // ============================================================
    // FALLBACK LOGIC (PREVENTS FRONTEND CRASHES)
    // ============================================================

    private String getFallbackFollowUpQuestion(List<Map<String, String>> conversationHistory) {
        if (conversationHistory == null || conversationHistory.isEmpty()) {
            return "Can you describe what primary symptoms you are experiencing today?";
        }

        int turnCount = conversationHistory.size();
        if (turnCount >= 6) {
            return "[COMPLETE]";
        }

        String lastUserText = "";
        for (int i = conversationHistory.size() - 1; i >= 0; i--) {
            Map<String, String> entry = conversationHistory.get(i);
            if (entry != null && "user".equalsIgnoreCase(entry.get("role"))) {
                lastUserText = entry.getOrDefault("text", "").toLowerCase();
                break;
            }
        }

        if (lastUserText.contains("no") || lastUserText.contains("nothing") || lastUserText.contains("done") || lastUserText.contains("complete")) {
            return "[COMPLETE]";
        }

        if (lastUserText.contains("headache") || lastUserText.contains("pain")) {
            return "How severe is this pain on a scale of 1 to 10, and when did it start?";
        } else if (lastUserText.contains("fever") || lastUserText.contains("cold") || lastUserText.contains("cough")) {
            return "Have you measured your body temperature, and do you have chills or body aches?";
        }

        return "How long have you been experiencing these symptoms, and does anything make them better or worse?";
    }

    private String buildFallbackSummary(String symptoms, String patientAnswers) {
        return "CHIEF COMPLAINT:\n" + safeText(symptoms) + "\n\n" +
                "HISTORY OF PRESENT ILLNESS & TIMELINE:\n" +
                "- Onset: Reported in initial voice intake\n" +
                "- Duration: " + safeText(patientAnswers) + "\n" +
                "- Severity: Not explicitly rated\n\n" +
                "ASSOCIATED SYMPTOMS:\n- As described in patient transcript: " + safeText(patientAnswers) + "\n\n" +
                "IMPORTANT INFORMATION FOR DOCTOR:\n- Voice intake completed. Please review full patient transcript during consultation.";
    }

    // ============================================================
    // HELPER: CREATE HEADERS
    // ============================================================

    private HttpHeaders createOpenRouterHeaders(String key) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(key);
        headers.set("HTTP-Referer", "http://localhost:8080");
        headers.set("X-Title", "Clinical Voice Intake System");
        return headers;
    }

    // ============================================================
    // HELPER: EXTRACT RESPONSE CONTENT
    // ============================================================

    @SuppressWarnings("unchecked")
    private String extractResponseContent(ResponseEntity<Map> response) {

        if (response == null || response.getBody() == null) {
            throw new RuntimeException("OpenRouter returned null response.");
        }

        Map body = response.getBody();
        List choices = (List) body.get("choices");

        if (choices == null || choices.isEmpty()) {
            throw new RuntimeException("OpenRouter returned no response choices.");
        }

        Map firstChoice = (Map) choices.get(0);
        Map messageMap = (Map) firstChoice.get("message");

        if (messageMap == null || !messageMap.containsKey("content")) {
            throw new RuntimeException("OpenRouter response message contains no content.");
        }

        return ((String) messageMap.get("content")).trim();
    }

    private String safeText(String text) {
        if (text == null || text.isBlank()) {
            return "Not reported";
        }
        return text;
    }
}