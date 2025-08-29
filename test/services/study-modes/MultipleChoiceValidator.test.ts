// Test-Driven Development - Tests for MultipleChoiceValidator
// Validates Strategy pattern implementation and scoring algorithms

import { describe, test, expect, beforeEach } from 'vitest';
import type { MultipleChoiceQuestion, UserProgress } from '../../../src/utils/types';
import { MultipleChoiceValidator } from '../../../src/services/study-modes/MultipleChoiceValidator';
import type { AnswerSubmission } from '../../../src/services/study-modes/IAnswerValidator';

describe('MultipleChoiceValidator', () => {
  let validator: MultipleChoiceValidator;
  let sampleQuestion: MultipleChoiceQuestion;

  beforeEach(() => {
    validator = new MultipleChoiceValidator();
    sampleQuestion = {
      id: 'mc-test-1',
      type: 'multiple-choice',
      question: 'What is the correct answer?',
      options: [
        { id: 'a', text: 'Correct Answer', explanation: 'This is the right choice' },
        { id: 'b', text: 'Wrong Answer 1', explanation: 'This is incorrect because...' },
        { id: 'c', text: 'Wrong Answer 2', explanation: 'This is also wrong' }
      ],
      correctAnswerIndex: 0,
      category: 'basics',
      subcategory: 'test',
      difficulty: 5,
      tags: ['test'],
      explanation: 'Overall explanation for the question',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      version: 1
    };
  });

  describe('canValidate', () => {
    test('should return true for multiple-choice questions', () => {
      expect(validator.canValidate(sampleQuestion)).toBe(true);
    });

    test('should return false for flip-card questions', () => {
      const flipCard = { ...sampleQuestion, type: 'flip-card' } as any;
      expect(validator.canValidate(flipCard)).toBe(false);
    });
  });

  describe('getMaxScore', () => {
    test('should return 1.2 as maximum score (includes bonuses)', () => {
      expect(validator.getMaxScore(sampleQuestion)).toBe(1.2);
    });

    test('should throw error for unsupported question types', () => {
      const flipCard = { ...sampleQuestion, type: 'flip-card' } as any;
      expect(() => validator.getMaxScore(flipCard)).toThrow();
    });
  });

  describe('validateAnswer', () => {
    test('should return correct result for right answer', () => {
      const submission: AnswerSubmission = {
        questionId: sampleQuestion.id,
        timestamp: new Date(),
        timeSpent: 5000, // 5 seconds
        userAnswer: { selectedIndex: 0 } // Correct answer
      };

      const result = validator.validateAnswer(sampleQuestion, submission);

      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1.2);
      expect(result.feedback).toContain('Correct');
    });

    test('should return incorrect result for wrong answer', () => {
      const submission: AnswerSubmission = {
        questionId: sampleQuestion.id,
        timestamp: new Date(),
        timeSpent: 5000,
        userAnswer: { selectedIndex: 1 } // Wrong answer
      };

      const result = validator.validateAnswer(sampleQuestion, submission);

      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('Incorrect');
      expect(result.feedback).toContain('Wrong Answer 1');
      expect(result.feedback).toContain('Correct Answer');
    });

    test('should apply difficulty bonus for hard questions', () => {
      const hardQuestion = { ...sampleQuestion, difficulty: 8 };
      const submission: AnswerSubmission = {
        questionId: hardQuestion.id,
        timestamp: new Date(),
        timeSpent: 5000,
        userAnswer: { selectedIndex: 0 }
      };

      const result = validator.validateAnswer(hardQuestion, submission);

      expect(result.score).toBeGreaterThan(1.0); // Should have difficulty bonus
    });

    test('should apply time penalty for very slow answers', () => {
      const submission: AnswerSubmission = {
        questionId: sampleQuestion.id,
        timestamp: new Date(),
        timeSpent: 30000, // 30 seconds - very slow
        userAnswer: { selectedIndex: 0 }
      };

      const result = validator.validateAnswer(sampleQuestion, submission);

      expect(result.timePenalty).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(1.0);
    });

    test('should apply time bonus for fast correct answers', () => {
      const submission: AnswerSubmission = {
        questionId: sampleQuestion.id,
        timestamp: new Date(),
        timeSpent: 2000, // 2 seconds - fast but not too fast
        userAnswer: { selectedIndex: 0 }
      };

      const result = validator.validateAnswer(sampleQuestion, submission);

      expect(result.score).toBeGreaterThan(1.0); // Should have time bonus
    });

    test('should include explanations in result', () => {
      const submission: AnswerSubmission = {
        questionId: sampleQuestion.id,
        timestamp: new Date(),
        timeSpent: 5000,
        userAnswer: { selectedIndex: 1 } // Wrong answer
      };

      const result = validator.validateAnswer(sampleQuestion, submission);

      expect(result.explanation).toContain('Overall explanation');
      expect(result.explanation).toContain('This is incorrect because');
    });

    test('should throw error for invalid submission format', () => {
      const invalidSubmission: AnswerSubmission = {
        questionId: sampleQuestion.id,
        timestamp: new Date(),
        timeSpent: 5000,
        userAnswer: { invalid: 'format' } // Invalid format
      };

      expect(() => {
        validator.validateAnswer(sampleQuestion, invalidSubmission);
      }).toThrow('Invalid submission format');
    });

    test('should throw error for unsupported question type', () => {
      const flipCard = { ...sampleQuestion, type: 'flip-card' } as any;
      const submission: AnswerSubmission = {
        questionId: flipCard.id,
        timestamp: new Date(),
        timeSpent: 5000,
        userAnswer: { selectedIndex: 0 }
      };

      expect(() => {
        validator.validateAnswer(flipCard, submission);
      }).toThrow('MultipleChoiceValidator cannot validate question type');
    });
  });

  describe('validateWithProgress', () => {
    test('should apply progress-based adjustments', () => {
      const progress: UserProgress = {
        questionId: sampleQuestion.id,
        knownCount: 5,
        unknownCount: 3,
        lastStudied: '2025-01-01',
        difficulty: 5,
        consecutiveCorrect: 4, // High streak
        averageTime: 4000,
        isFavorite: false
      };

      const submission: AnswerSubmission = {
        questionId: sampleQuestion.id,
        timestamp: new Date(),
        timeSpent: 5000,
        userAnswer: { selectedIndex: 0 }
      };

      const result = validator.validateWithProgress(sampleQuestion, submission, progress);

      expect(result.isCorrect).toBe(true);
      expect(result.feedback).toContain('on a roll'); // Should have streak feedback
    });

    test('should apply penalty for repeated mistakes', () => {
      const progress: UserProgress = {
        questionId: sampleQuestion.id,
        knownCount: 1,
        unknownCount: 4, // Many mistakes
        lastStudied: '2025-01-01',
        difficulty: 5,
        consecutiveCorrect: 0,
        averageTime: 8000,
        isFavorite: false
      };

      const submission: AnswerSubmission = {
        questionId: sampleQuestion.id,
        timestamp: new Date(),
        timeSpent: 5000,
        userAnswer: { selectedIndex: 1 } // Wrong answer
      };

      const result = validator.validateWithProgress(sampleQuestion, submission, progress);

      expect(result.score).toBeLessThan(0); // Should be penalized
      expect(result.feedback).toContain('tricky'); // Should suggest reviewing
    });

    test('should work without progress data', () => {
      const submission: AnswerSubmission = {
        questionId: sampleQuestion.id,
        timestamp: new Date(),
        timeSpent: 5000,
        userAnswer: { selectedIndex: 0 }
      };

      const result = validator.validateWithProgress(sampleQuestion, submission);

      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });
  });
});