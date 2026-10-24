package com.quiz.service;

import org.springframework.stereotype.Service;

@Service
public class ScoreCalculatorService {

    // Formula: +4 for correct, -1 for wrong
    public int calculateScore(int correctAnswers, int wrongAnswers) {
        if (correctAnswers < 0 || wrongAnswers < 0) {
            throw new IllegalArgumentException("Counts cannot be negative");
        }
        return (correctAnswers * 4) - (wrongAnswers * 1);
    }

    public boolean isSubmissionValid(long timeTakenSeconds, long maxAllowedSeconds) {
        return timeTakenSeconds > 0 && timeTakenSeconds <= maxAllowedSeconds;
    }
}
