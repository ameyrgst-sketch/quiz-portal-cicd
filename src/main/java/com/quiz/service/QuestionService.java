package com.quiz.service;

import com.quiz.dto.QuestionRequest;
import com.quiz.dto.QuestionResponse;
import com.quiz.model.Question;
import com.quiz.model.Quiz;
import com.quiz.repository.QuestionRepository;
import com.quiz.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuizRepository quizRepository;

    public QuestionResponse addQuestion(QuestionRequest request) {
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        Question question = new Question();
        question.setQuiz(quiz);
        question.setQuestionText(request.getQuestionText());
        question.setOptionA(request.getOptionA());
        question.setOptionB(request.getOptionB());
        question.setOptionC(request.getOptionC());
        question.setOptionD(request.getOptionD());
        question.setCorrectOption(request.getCorrectOption().toUpperCase());
        question.setOrderIndex(request.getOrderIndex());

        Question saved = questionRepository.save(question);
        return toResponse(saved, true);
    }

    public List<QuestionResponse> getQuestionsForQuiz(Long quizId, boolean includeAnswer) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        return questionRepository.findByQuizOrderByOrderIndex(quiz).stream()
                .map(q -> toResponse(q, includeAnswer))
                .collect(Collectors.toList());
    }

    public QuestionResponse updateQuestion(Long questionId, QuestionRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        question.setQuestionText(request.getQuestionText());
        question.setOptionA(request.getOptionA());
        question.setOptionB(request.getOptionB());
        question.setOptionC(request.getOptionC());
        question.setOptionD(request.getOptionD());
        question.setCorrectOption(request.getCorrectOption().toUpperCase());
        question.setOrderIndex(request.getOrderIndex());
        Question saved = questionRepository.save(question);
        return toResponse(saved, true);
    }

    public void deleteQuestion(Long questionId) {
        questionRepository.deleteById(questionId);
    }

    private QuestionResponse toResponse(Question q, boolean includeAnswer) {
        QuestionResponse r = new QuestionResponse();
        r.setId(q.getId());
        r.setQuestionText(q.getQuestionText());
        r.setOptionA(q.getOptionA());
        r.setOptionB(q.getOptionB());
        r.setOptionC(q.getOptionC());
        r.setOptionD(q.getOptionD());
        r.setOrderIndex(q.getOrderIndex());
        r.setQuizId(q.getQuiz().getId());
        if (includeAnswer) {
            r.setCorrectOption(q.getCorrectOption());
        }
        return r;
    }
}
