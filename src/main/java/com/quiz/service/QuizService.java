package com.quiz.service;

import com.quiz.dto.QuizRequest;
import com.quiz.dto.QuizResponse;
import com.quiz.model.Quiz;
import com.quiz.model.User;
import com.quiz.repository.QuestionRepository;
import com.quiz.repository.QuizRepository;
import com.quiz.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    public QuizResponse createQuiz(QuizRequest request) {
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (teacher.getRole() != User.Role.TEACHER) {
            throw new RuntimeException("Only teachers can create quizzes");
        }

        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        quiz.setCreatedBy(teacher);
        quiz.setActive(true);

        Quiz saved = quizRepository.save(quiz);
        return toResponse(saved, 0);
    }

    public List<QuizResponse> getAllActiveQuizzes() {
        return quizRepository.findByActiveTrue().stream()
                .map(q -> toResponse(q, (int) questionRepository.countByQuizId(q.getId())))
                .collect(Collectors.toList());
    }

    public List<QuizResponse> getQuizzesByTeacher(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        return quizRepository.findByCreatedBy(teacher).stream()
                .map(q -> toResponse(q, (int) questionRepository.countByQuizId(q.getId())))
                .collect(Collectors.toList());
    }

    public QuizResponse getQuizById(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        int count = (int) questionRepository.countByQuizId(quizId);
        return toResponse(quiz, count);
    }

    public QuizResponse updateQuiz(Long quizId, QuizRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        Quiz saved = quizRepository.save(quiz);
        int count = (int) questionRepository.countByQuizId(quizId);
        return toResponse(saved, count);
    }

    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        quizRepository.delete(quiz);
    }

    public QuizResponse toggleActive(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        quiz.setActive(!quiz.isActive());
        Quiz saved = quizRepository.save(quiz);
        int count = (int) questionRepository.countByQuizId(quizId);
        return toResponse(saved, count);
    }

    private QuizResponse toResponse(Quiz quiz, int questionCount) {
        QuizResponse r = new QuizResponse();
        r.setId(quiz.getId());
        r.setTitle(quiz.getTitle());
        r.setDescription(quiz.getDescription());
        r.setTimeLimitMinutes(quiz.getTimeLimitMinutes());
        r.setCreatedByName(quiz.getCreatedBy().getFullName());
        r.setCreatedById(quiz.getCreatedBy().getId());
        r.setQuestionCount(questionCount);
        r.setCreatedAt(quiz.getCreatedAt());
        r.setActive(quiz.isActive());
        return r;
    }
}
