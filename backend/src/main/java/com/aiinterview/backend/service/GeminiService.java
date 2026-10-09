package com.aiinterview.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<String> generateQuestions(String type, String subject, String resumeText, String targetCompany, int count) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("${GEMINI_API_KEY}")) {
            return getMockQuestions(type, subject, count);
        }

        String companyPhrase = (targetCompany != null && !targetCompany.trim().isEmpty() && !targetCompany.equalsIgnoreCase("none") && !targetCompany.equalsIgnoreCase("general"))
                ? " at " + targetCompany
                : "";

        String prompt = "You are an expert interviewer. Generate " + count + " professional interview questions for a " +
                type + " interview" + companyPhrase + ". The subject or job role is: " + (subject != null ? subject : "General") + ".\n" +
                (resumeText != null && !resumeText.isEmpty() ? "Here is the candidate's resume/profile content for context to tailor questions:\n" + resumeText + "\n" : "") +
                "Output ONLY the questions. List them in a plain text format, one per line. Do not prefix with numbers or bullets.";

        try {
            String aiResponse = callGeminiApi(prompt);
            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                return getMockQuestions(type, subject, count);
            }

            List<String> questions = new ArrayList<>();
            String[] lines = aiResponse.split("\n");
            for (String line : lines) {
                String clean = line.replaceAll("^\\d+\\.\\s*", "").trim();
                if (!clean.isEmpty()) {
                    questions.add(clean);
                }
            }
            // If we didn't get enough questions, pad with mocks
            if (questions.size() < count) {
                List<String> mocks = getMockQuestions(type, subject, count);
                for (int i = questions.size(); i < count; i++) {
                    questions.add(mocks.get(i % mocks.size()));
                }
            }
            return questions.subList(0, Math.min(questions.size(), count));
        } catch (Exception e) {
            System.err.println("Gemini API call failed. Falling back to mocks: " + e.getMessage());
            return getMockQuestions(type, subject, count);
        }
    }

    public Map<String, Object> evaluateAnswer(String question, String candidateAnswer) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("${GEMINI_API_KEY}")) {
            return getMockEvaluation(question, candidateAnswer);
        }

        String prompt = "You are an AI Interview evaluator. Evaluate the candidate's answer to the following question:\n" +
                "Question: " + question + "\n" +
                "Candidate Answer: " + (candidateAnswer != null && !candidateAnswer.trim().isEmpty() ? candidateAnswer : "[No Answer / Silence]") + "\n\n" +
                "Analyze the answer for technical correctness, clarity, completeness, and structure.\n" +
                "Generate scores from 0.0 to 10.0.\n" +
                "Provide constructive, specific feedback.\n" +
                "Return the response in EXACTLY the following JSON format without any markdown wrapper or backticks:\n" +
                "{\n" +
                "  \"score\": 8.5,\n" +
                "  \"confidenceScore\": 7.5,\n" +
                "  \"eyeContactScore\": 8.0,\n" +
                "  \"feedback\": \"Constructive feedback text goes here.\"\n" +
                "}";

        try {
            String responseText = callGeminiApi(prompt);
            // Strip any markdown code fence blocks if returned
            if (responseText.contains("```json")) {
                responseText = responseText.substring(responseText.indexOf("```json") + 7);
                responseText = responseText.substring(0, responseText.lastIndexOf("```"));
            } else if (responseText.contains("```")) {
                responseText = responseText.substring(responseText.indexOf("```") + 3);
                responseText = responseText.substring(0, responseText.lastIndexOf("```"));
            }
            responseText = responseText.trim();

            JsonNode root = objectMapper.readTree(responseText);
            Map<String, Object> result = new HashMap<>();
            result.put("score", root.path("score").asDouble(7.0));
            result.put("confidenceScore", root.path("confidenceScore").asDouble(7.5));
            result.put("eyeContactScore", root.path("eyeContactScore").asDouble(8.0));
            result.put("feedback", root.path("feedback").asText("Good attempt. Review details to expand further."));
            return result;
        } catch (Exception e) {
            System.err.println("Gemini evaluation API call failed. Falling back to mocks: " + e.getMessage());
            return getMockEvaluation(question, candidateAnswer);
        }
    }

    private String callGeminiApi(String prompt) throws Exception {
        String url = apiUrl + "?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> partContainer = new HashMap<>();
        partContainer.put("parts", List.of(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(partContainer));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText();
        }
        return null;
    }

    private List<String> getMockQuestions(String type, String subject, int count) {
        List<String> list = new ArrayList<>();
        if ("TECHNICAL".equalsIgnoreCase(type)) {
            if (subject != null && subject.toLowerCase().contains("java")) {
                list.add("Explain the concept of OOPs in Java and how it is implemented.");
                list.add("What is the difference between Abstract Class and Interface in Java?");
                list.add("Explain the Spring Boot application lifecycle and dependency injection.");
                list.add("What is Hibernate and how does JPA facilitate database ORM?");
                list.add("How do you handle Exception Handling in Spring Boot APIs?");
            } else if (subject != null && subject.toLowerCase().contains("python")) {
                list.add("What are list comprehensions and generators in Python? Explain with differences.");
                list.add("How does memory management work in Python (Garbage Collection and Reference Counting)?");
                list.add("Explain decorators in Python and how they can be used.");
                list.add("What is the difference between multithreading and multiprocessing in Python?");
                list.add("How do you connect a Python script to a PostgreSQL database using psycopg2?");
            } else {
                list.add("Explain REST API design principles and standard HTTP status codes.");
                list.add("What is the difference between SQL and NoSQL databases?");
                list.add("Explain MVC architecture and how it is implemented in web frameworks.");
                list.add("How does Git version control work? Explain the difference between git merge and git rebase.");
                list.add("What is JWT authentication and how does it secure web applications?");
            }
        } else if ("CODING".equalsIgnoreCase(type)) {
            list.add("Write a function to check if a given string is a palindrome.");
            list.add("Given an array of integers, write an algorithm to find the two numbers that add up to a specific target.");
            list.add("Explain how you would reverse a singly linked list.");
            list.add("Write a program to find the middle element of a linked list in one pass.");
            list.add("Explain the difference between Quick Sort and Merge Sort. What are their time complexities?");
        } else if ("APTITUDE".equalsIgnoreCase(type)) {
            list.add("A train 120m long passes a telegraph post in 6 seconds. What is the speed of the train in km/h?");
            list.add("A and B can do a work in 12 days, B and C in 15 days, C and A in 20 days. If A, B, and C work together, in how many days will they finish the work?");
            list.add("If the cost price of 15 articles is equal to the selling price of 12 articles, find the gain percentage.");
            list.add("A sum of money doubles itself in 8 years at simple interest. What is the rate of interest per annum?");
            list.add("Find the missing number in the sequence: 3, 5, 9, 17, 33, ?");
        } else { // HR
            list.add("Tell me about yourself and your academic background.");
            list.add("What are your strengths and weaknesses?");
            list.add("Why do you want to join our organization?");
            list.add("Describe a challenging situation in a project and how you resolved it.");
            list.add("Where do you see yourself in five years?");
        }

        // Shuffle and take requested count
        Collections.shuffle(list);
        List<String> result = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            result.add(list.get(i % list.size()));
        }
        return result;
    }

    private Map<String, Object> getMockEvaluation(String question, String answer) {
        Map<String, Object> map = new HashMap<>();
        if (answer == null || answer.trim().isEmpty()) {
            map.put("score", 2.0);
            map.put("confidenceScore", 2.0);
            map.put("eyeContactScore", 5.0);
            map.put("feedback", "No verbal response detected. Please check your mic and try to articulate a response even if you are unsure.");
            return map;
        }

        int length = answer.trim().split("\\s+").length;
        double baseScore = 6.0;
        
        // Simple heuristic rules based on length and keywords
        if (length > 40) baseScore += 2.0;
        else if (length > 20) baseScore += 1.0;
        else baseScore -= 1.0;

        String lowerAns = answer.toLowerCase();
        if (lowerAns.contains("because") || lowerAns.contains("example") || lowerAns.contains("specifically")) {
            baseScore += 1.0;
        }
        if (lowerAns.contains("don't know") || lowerAns.contains("not sure")) {
            baseScore -= 1.5;
        }

        baseScore = Math.max(1.0, Math.min(10.0, baseScore));
        
        // Randomize confidence and eye contact scores slightly for realism
        double conf = 6.0 + Math.random() * 3.5;
        double eye = 7.0 + Math.random() * 2.5;

        // Round to 1 decimal place
        map.put("score", Math.round(baseScore * 10.0) / 10.0);
        map.put("confidenceScore", Math.round(conf * 10.0) / 10.0);
        map.put("eyeContactScore", Math.round(eye * 10.0) / 10.0);

        String feedbackText;
        if (baseScore >= 8.0) {
            feedbackText = "Excellent response! Your explanation is thorough, structured, and displays strong domain knowledge. You used relevant terminology and details.";
        } else if (baseScore >= 6.0) {
            feedbackText = "Good effort. You addressed the core concept correctly, but you could enhance your answer by providing real-world examples or explaining underlying mechanisms (e.g. memory structures, complexity metrics) in more detail.";
        } else {
            feedbackText = "The response is a bit too brief or lacks key technical details. Practice structuring your answer using the STAR method (Situation, Task, Action, Result) or detailing architectural components.";
        }
        
        map.put("feedback", feedbackText);
        return map;
    }

    public String analyzeResume(String resumeText) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("${GEMINI_API_KEY}")) {
            return getLocalResumeAnalysis(resumeText);
        }

        String prompt = "You are an expert ATS (Applicant Tracking System) scanner and professional resume reviewer.\n" +
                "Analyze the following resume/profile text and provide:\n" +
                "1. Extracted skills (JSON array of strings)\n" +
                "2. Estimated experience level (string, e.g. 'Entry Level', 'Mid Level', 'Senior Level')\n" +
                "3. Suggested job role (string)\n" +
                "4. ATS score (integer between 0 and 100 based on keyword match, professional structure, formatting compatibility, and bullet impact)\n" +
                "5. Actionable feedback recommendations (JSON array of strings, 3 to 5 recommendations)\n\n" +
                "Resume text:\n" + resumeText + "\n\n" +
                "You must return the response in EXACTLY the following JSON format without any markdown wrapper or backticks:\n" +
                "{\n" +
                "  \"skills\": [\"Skill1\", \"Skill2\"],\n" +
                "  \"experience\": \"Level\",\n" +
                "  \"suggestedRole\": \"Suggested Role\",\n" +
                "  \"atsScore\": 85,\n" +
                "  \"feedback\": [\"Feedback point 1\", \"Feedback point 2\"]\n" +
                "}";

        try {
            String responseText = callGeminiApi(prompt);
            // Strip any markdown code fence blocks if returned
            if (responseText.contains("```json")) {
                responseText = responseText.substring(responseText.indexOf("```json") + 7);
                responseText = responseText.substring(0, responseText.lastIndexOf("```"));
            } else if (responseText.contains("```")) {
                responseText = responseText.substring(responseText.indexOf("```") + 3);
                responseText = responseText.substring(0, responseText.lastIndexOf("```"));
            }
            responseText = responseText.trim();
            // Validate JSON format
            objectMapper.readTree(responseText);
            return responseText;
        } catch (Exception e) {
            System.err.println("Gemini resume analysis failed. Falling back to local mock: " + e.getMessage());
            return getLocalResumeAnalysis(resumeText);
        }
    }

    private String getLocalResumeAnalysis(String resumeText) {
        if (resumeText == null || resumeText.trim().isEmpty()) {
            return "{\n" +
                    "  \"skills\": [],\n" +
                    "  \"experience\": \"Unknown\",\n" +
                    "  \"suggestedRole\": \"Software Engineer\",\n" +
                    "  \"atsScore\": 30,\n" +
                    "  \"feedback\": [\"Please upload a valid resume file to generate an ATS score and feedback.\"]\n" +
                    "}";
        }

        String lowerText = resumeText.toLowerCase();
        List<String> foundSkills = new ArrayList<>();
        
        // Match common skills
        String[] possibleSkills = {"java", "spring boot", "javascript", "react", "python", "mysql", "postgresql", 
                                   "rest apis", "html5", "css3", "docker", "kubernetes", "aws", "git", "c++", 
                                   "angular", "node.js", "express", "mongodb", "typescript"};
        
        for (String skill : possibleSkills) {
            if (lowerText.contains(skill)) {
                // Capitalize properly
                if (skill.equals("rest apis")) foundSkills.add("REST APIs");
                else if (skill.equals("spring boot")) foundSkills.add("Spring Boot");
                else if (skill.equals("html5")) foundSkills.add("HTML5");
                else if (skill.equals("css3")) foundSkills.add("CSS3");
                else if (skill.equals("node.js")) foundSkills.add("Node.js");
                else if (skill.equals("mysql")) foundSkills.add("MySQL");
                else if (skill.equals("postgresql")) foundSkills.add("PostgreSQL");
                else if (skill.equals("mongodb")) foundSkills.add("MongoDB");
                else if (skill.equals("c++")) foundSkills.add("C++");
                else if (skill.equals("aws")) foundSkills.add("AWS");
                else {
                    foundSkills.add(Character.toUpperCase(skill.charAt(0)) + skill.substring(1));
                }
            }
        }

        if (foundSkills.isEmpty()) {
            foundSkills.add("Java");
            foundSkills.add("Spring Boot");
            foundSkills.add("React");
        }

        // Determine experience level
        String experience = "Entry Level";
        if (lowerText.contains("senior") || lowerText.contains("lead") || lowerText.contains("manager") || lowerText.contains("architect")) {
            experience = "Senior Level";
        } else if (lowerText.contains("mid") || lowerText.contains("experienced") || lowerText.contains("associate") || lowerText.contains("years experience")) {
            experience = "Mid Level";
        }

        // Determine suggested role
        String suggestedRole = "Full Stack Developer";
        if (lowerText.contains("frontend") || lowerText.contains("ui") || lowerText.contains("web designer")) {
            suggestedRole = "Frontend Developer";
        } else if (lowerText.contains("backend") || lowerText.contains("api") || lowerText.contains("server")) {
            suggestedRole = "Backend Developer";
        } else if (lowerText.contains("data scientist") || lowerText.contains("machine learning") || lowerText.contains("ml")) {
            suggestedRole = "Data/ML Engineer";
        } else if (lowerText.contains("devops") || lowerText.contains("cloud") || lowerText.contains("infrastructure")) {
            suggestedRole = "DevOps Engineer";
        }

        // Compute ATS Score based on sections, word count, and skills count
        int score = 45; // base score

        // Check for sections
        boolean hasEducation = lowerText.contains("education") || lowerText.contains("degree") || lowerText.contains("university") || lowerText.contains("college");
        boolean hasExperience = lowerText.contains("experience") || lowerText.contains("work") || lowerText.contains("employment") || lowerText.contains("history");
        boolean hasProjects = lowerText.contains("projects") || lowerText.contains("portfolio") || lowerText.contains("key projects");
        boolean hasSkills = lowerText.contains("skills") || lowerText.contains("technologies") || lowerText.contains("technical skills");

        if (hasEducation) score += 10;
        if (hasExperience) score += 12;
        if (hasProjects) score += 10;
        if (hasSkills) score += 8;

        // Skills weight
        score += Math.min(foundSkills.size() * 2, 10);

        // Word count penalty/bonus
        int wordCount = resumeText.split("\\s+").length;
        if (wordCount >= 200 && wordCount <= 800) {
            score += 5;
        } else if (wordCount < 100 || wordCount > 1500) {
            score -= 10;
        }

        score = Math.max(10, Math.min(98, score)); // Keep score realistic, capped at 98 for mock/local fallback

        // Generate custom feedback suggestions
        List<String> feedback = new ArrayList<>();
        if (!hasEducation) {
            feedback.add("Add a dedicated 'Education' section detailing your degree, university, and graduation year.");
        }
        if (!hasExperience) {
            feedback.add("Add a 'Work Experience' or 'Internship' section to showcase practical applications of your skills.");
        }
        if (!hasProjects) {
            feedback.add("Include a 'Projects' section featuring 2-3 key technical projects with links to GitHub or live demos.");
        }
        if (!hasSkills) {
            feedback.add("Group your technologies in a clear 'Skills' section categorized by languages, frameworks, and databases.");
        }
        if (wordCount < 200) {
            feedback.add("Your resume is very brief. Expand on your project descriptions, noting the challenges, solutions, and technologies used.");
        } else if (wordCount > 1000) {
            feedback.add("Your resume is quite long. Focus on summarizing your bullet points and keeping it to a clean 1-2 pages maximum.");
        }
        
        // Generic ATS advice if list is short
        if (feedback.size() < 3) {
            feedback.add("Use strong action verbs (e.g. 'designed', 'optimized', 'implemented') at the start of your experience bullet points.");
            feedback.add("Incorporate quantifiable metrics (e.g. 'reduced latency by 15%', 'increased user engagement by 20%') to show measurable impact.");
            feedback.add("Avoid double-column tables or graphics, as they can sometimes confuse older ATS parser scanners.");
        }

        // Build JSON manually to avoid jackson mapping complexities in simple local method
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"skills\": [");
        for (int i = 0; i < foundSkills.size(); i++) {
            sb.append("\"").append(foundSkills.get(i)).append("\"");
            if (i < foundSkills.size() - 1) sb.append(", ");
        }
        sb.append("],\n");
        sb.append("  \"experience\": \"").append(experience).append("\",\n");
        sb.append("  \"suggestedRole\": \"").append(suggestedRole).append("\",\n");
        sb.append("  \"atsScore\": ").append(score).append(",\n");
        sb.append("  \"feedback\": [");
        for (int i = 0; i < feedback.size(); i++) {
            sb.append("\"").append(feedback.get(i).replace("\"", "\\\"")).append("\"");
            if (i < feedback.size() - 1) sb.append(", ");
        }
        sb.append("]\n");
        sb.append("}");

        return sb.toString();
    }
}

