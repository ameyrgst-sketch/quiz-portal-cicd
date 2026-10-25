package com.quiz.controller;

import com.quiz.dto.SubmitRequest;
import com.quiz.dto.SubmitResponse;
import com.quiz.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = "*")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<?> submitQuiz(@RequestBody SubmitRequest request) {
        try {
            SubmitResponse response = submissionService.submitQuiz(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Student's own results
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<SubmitResponse>> getStudentResults(@PathVariable Long studentId) {
        return ResponseEntity.ok(submissionService.getStudentResults(studentId));
    }

    // Teacher view: all results for a quiz (leaderboard)
    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<SubmitResponse>> getQuizResults(@PathVariable Long quizId) {
        return ResponseEntity.ok(submissionService.getQuizResults(quizId));
    }
}
