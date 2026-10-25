package com.quiz.repository;

import com.quiz.model.Quiz;
import com.quiz.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByCreatedBy(User teacher);
    List<Quiz> findByActiveTrue();
    List<Quiz> findByCreatedByAndActiveTrue(User teacher);
}
