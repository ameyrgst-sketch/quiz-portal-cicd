package com.quiz.dto;

import java.util.Map;

public class SubmitRequest {
    private Long studentId;
    private Long quizId;
    private Map<Long, String> answers; // questionId -> selectedOption
    private long timeTakenSeconds;

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }

    public Map<Long, String> getAnswers() { return answers; }
    public void setAnswers(Map<Long, String> answers) { this.answers = answers; }

    public long getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(long timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }
}
