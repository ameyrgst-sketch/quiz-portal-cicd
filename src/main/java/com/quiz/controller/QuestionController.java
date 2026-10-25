package com.quiz.controller;

import com.quiz.dto.QuestionRequest;
import com.quiz.dto.QuestionResponse;
import com.quiz.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "*")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @PostMapping
    public ResponseEntity<QuestionResponse> addQuestion(@RequestBody QuestionRequest request) {
        return ResponseEntity.ok(questionService.addQuestion(request));
    }

    // Teacher view - includes correct answers
    @GetMapping("/quiz/{quizId}/teacher")
    public ResponseEntity<List<QuestionResponse>> getQuestionsForTeacher(@PathVariable Long quizId) {
        return ResponseEntity.ok(questionService.getQuestionsForQuiz(quizId, true));
    }

    // Student view - hides correct answers
    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<QuestionResponse>> getQuestionsForStudent(@PathVariable Long quizId) {
        return ResponseEntity.ok(questionService.getQuestionsForQuiz(quizId, false));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionResponse> updateQuestion(
            @PathVariable Long id,
            @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok("Question deleted successfully");
    }
}
