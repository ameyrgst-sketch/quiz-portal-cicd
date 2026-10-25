package com.quiz.service;

import com.quiz.dto.SubmitRequest;
import com.quiz.dto.SubmitResponse;
import com.quiz.model.*;
import com.quiz.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ScoreCalculatorService scoreCalculatorService;

    public SubmitResponse submitQuiz(SubmitRequest request) {
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("Only students can submit quizzes");
        }

        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        if (!quiz.isActive()) {
            throw new RuntimeException("Quiz is not active");
        }

        if (submissionRepository.existsByStudentAndQuiz(student, quiz)) {
            throw new RuntimeException("You have already submitted this quiz");
        }

        // Validate time
        long maxSeconds = (long) quiz.getTimeLimitMinutes() * 60;
        if (!scoreCalculatorService.isSubmissionValid(request.getTimeTakenSeconds(), maxSeconds)) {
            throw new RuntimeException("Submission time is invalid");
        }

        // Load questions
        List<Question> questions = questionRepository.findByQuizOrderByOrderIndex(quiz);

        // Calculate score
        Map<Long, String> studentAnswers = request.getAnswers();
        int correct = 0;
        int wrong = 0;
        int skipped = 0;

        for (Question q : questions) {
            String selected = studentAnswers.get(q.getId());
            if (selected == null || selected.isBlank()) {
                skipped++;
            } else if (selected.equalsIgnoreCase(q.getCorrectOption())) {
                correct++;
            } else {
                wrong++;
            }
        }

        int score = scoreCalculatorService.calculateScore(correct, wrong);

        // Save submission
        Submission submission = new Submission();
        submission.setStudent(student);
        submission.setQuiz(quiz);
        submission.setAnswers(studentAnswers);
        submission.setScore(score);
        submission.setCorrectCount(correct);
        submission.setWrongCount(wrong);
        submission.setTotalQuestions(questions.size());
        submission.setTimeTakenSeconds(request.getTimeTakenSeconds());
        submission.setSubmittedAt(LocalDateTime.now());
        Submission saved = submissionRepository.save(submission);

        // Build response
        SubmitResponse response = new SubmitResponse();
        response.setSubmissionId(saved.getId());
        response.setQuizTitle(quiz.getTitle());
        response.setStudentName(student.getFullName());
        response.setScore(score);
        response.setCorrectCount(correct);
        response.setWrongCount(wrong);
        response.setSkippedCount(skipped);
        response.setTotalQuestions(questions.size());
        response.setTimeTakenSeconds(request.getTimeTakenSeconds());
        response.setSubmittedAt(saved.getSubmittedAt());
        int maxScore = questions.size() * 4;
        double pct = maxScore > 0 ? Math.round((score * 100.0 / maxScore) * 10) / 10.0 : 0.0;
        response.setPercentage(pct);
        return response;
    }

    public List<SubmitResponse> getStudentResults(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return submissionRepository.findByStudent(student).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SubmitResponse> getQuizResults(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        return submissionRepository.findByQuiz(quiz).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private SubmitResponse toResponse(Submission s) {
        SubmitResponse r = new SubmitResponse();
        r.setSubmissionId(s.getId());
        r.setQuizTitle(s.getQuiz().getTitle());
        r.setStudentName(s.getStudent().getFullName());
        r.setScore(s.getScore());
        r.setCorrectCount(s.getCorrectCount());
        r.setWrongCount(s.getWrongCount());
        r.setSkippedCount(s.getTotalQuestions() - s.getCorrectCount() - s.getWrongCount());
        r.setTotalQuestions(s.getTotalQuestions());
        r.setTimeTakenSeconds(s.getTimeTakenSeconds());
        r.setSubmittedAt(s.getSubmittedAt());
        int maxScore = s.getTotalQuestions() * 4;
        double pct = maxScore > 0 ? Math.round((s.getScore() * 100.0 / maxScore) * 10) / 10.0 : 0.0;
        r.setPercentage(pct);
        return r;
    }
}
