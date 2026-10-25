package com.quiz.repository;

import com.quiz.model.Question;
import com.quiz.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByQuizOrderByOrderIndex(Quiz quiz);
    List<Question> findByQuizId(Long quizId);
    long countByQuizId(Long quizId);
}
