package com.quiz.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ScoreCalculatorServiceTest {

    private ScoreCalculatorService calculator;

    @BeforeEach
    void setUp() {
        calculator = new ScoreCalculatorService();
    }

    @Test
    void testScoreCalculation() {
        // 5 correct (20) - 2 wrong (2) = 18 marks
        int score = calculator.calculateScore(5, 2);
        assertEquals(18, score, "Scoring logic produced incorrect result!");
    }

    @Test
    void testZeroScore() {
        assertEquals(0, calculator.calculateScore(0, 0));
    }

    @Test
    void testTimerLogicValid() {
        assertTrue(calculator.isSubmissionValid(120, 180));
    }

    @Test
    void testTimerLogicInvalid() {
        assertFalse(calculator.isSubmissionValid(200, 180));
    }
}