package com.quiz.repository;

import com.quiz.model.Submission;
import com.quiz.model.User;
import com.quiz.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    Optional<Submission> findByStudentAndQuiz(User student, Quiz quiz);
    List<Submission> findByStudent(User student);
    List<Submission> findByQuiz(Quiz quiz);
    boolean existsByStudentAndQuiz(User student, Quiz quiz);
}
