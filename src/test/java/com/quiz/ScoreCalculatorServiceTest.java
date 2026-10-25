package com.quiz;

import com.quiz.service.ScoreCalculatorService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

class ScoreCalculatorServiceTest {

    private ScoreCalculatorService scoreCalculatorService;

    @BeforeEach
    void setUp() {
        scoreCalculatorService = new ScoreCalculatorService();
    }

    @Test
    void testCalculateScore_AllCorrect() {
        // +4 per correct answer
        int score = scoreCalculatorService.calculateScore(10, 0);
        assertEquals(40, score, "All correct: 10 * 4 = 40");
    }

    @Test
    void testCalculateScore_SomWrong() {
        // +4 correct, -1 wrong
        int score = scoreCalculatorService.calculateScore(7, 3);
        assertEquals(25, score, "7*4 - 3*1 = 28 - 3 = 25");
    }

    @Test
    void testCalculateScore_AllWrong() {
        int score = scoreCalculatorService.calculateScore(0, 10);
        assertEquals(-10, score, "All wrong: 0 - 10 = -10");
    }

    @Test
    void testCalculateScore_NoneAnswered() {
        int score = scoreCalculatorService.calculateScore(0, 0);
        assertEquals(0, score, "No answers: score is 0");
    }

    @Test
    void testCalculateScore_NegativeInputThrows() {
        assertThrows(IllegalArgumentException.class,
            () -> scoreCalculatorService.calculateScore(-1, 0),
            "Negative correct count should throw");
        assertThrows(IllegalArgumentException.class,
            () -> scoreCalculatorService.calculateScore(0, -1),
            "Negative wrong count should throw");
    }

    @Test
    void testIsSubmissionValid_OnTime() {
        assertTrue(scoreCalculatorService.isSubmissionValid(600, 1800),
            "600s <= 1800s max should be valid");
    }

    @Test
    void testIsSubmissionValid_ExactMax() {
        assertTrue(scoreCalculatorService.isSubmissionValid(1800, 1800),
            "Exactly at max time should be valid");
    }

    @Test
    void testIsSubmissionValid_Overtime() {
        assertFalse(scoreCalculatorService.isSubmissionValid(1801, 1800),
            "1 second over max should be invalid");
    }

    @Test
    void testIsSubmissionValid_ZeroTime() {
        assertFalse(scoreCalculatorService.isSubmissionValid(0, 1800),
            "Zero time taken should be invalid");
    }

    @Test
    void testIsSubmissionValid_NegativeTime() {
        assertFalse(scoreCalculatorService.isSubmissionValid(-1, 1800),
            "Negative time should be invalid");
    }
}
