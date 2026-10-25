package com.quiz.dto;

import java.time.LocalDateTime;

public class SubmitResponse {
    private Long submissionId;
    private String quizTitle;
    private String studentName;
    private int score;
    private int correctCount;
    private int wrongCount;
    private int skippedCount;
    private int totalQuestions;
    private long timeTakenSeconds;
    private LocalDateTime submittedAt;
    private double percentage;

    public SubmitResponse() {}

    // Getters & Setters
    public Long getSubmissionId() { return submissionId; }
    public void setSubmissionId(Long submissionId) { this.submissionId = submissionId; }

    public String getQuizTitle() { return quizTitle; }
    public void setQuizTitle(String quizTitle) { this.quizTitle = quizTitle; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getCorrectCount() { return correctCount; }
    public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }

    public int getWrongCount() { return wrongCount; }
    public void setWrongCount(int wrongCount) { this.wrongCount = wrongCount; }

    public int getSkippedCount() { return skippedCount; }
    public void setSkippedCount(int skippedCount) { this.skippedCount = skippedCount; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public long getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(long timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }
}
