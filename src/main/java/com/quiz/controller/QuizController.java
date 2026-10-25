package com.quiz.controller;

import com.quiz.dto.QuizRequest;
import com.quiz.dto.QuizResponse;
import com.quiz.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @PostMapping
    public ResponseEntity<QuizResponse> createQuiz(@RequestBody QuizRequest request) {
        return ResponseEntity.ok(quizService.createQuiz(request));
    }

    @GetMapping
    public ResponseEntity<List<QuizResponse>> getAllActiveQuizzes() {
        return ResponseEntity.ok(quizService.getAllActiveQuizzes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizResponse> getQuizById(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizById(id));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<QuizResponse>> getQuizzesByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(quizService.getQuizzesByTeacher(teacherId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuizResponse> updateQuiz(@PathVariable Long id, @RequestBody QuizRequest request) {
        return ResponseEntity.ok(quizService.updateQuiz(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.ok("Quiz deleted successfully");
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<QuizResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.toggleActive(id));
    }
}
