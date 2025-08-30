import { describe, it, expect, beforeEach } from 'vitest';
import { AnswerValidator } from '../../src/services/AnswerValidator';
import { MultipleChoiceQuestion } from '../../src/models/MultipleChoiceQuestion';
import { Option } from '../../src/models/Option';
import type { IQuestion } from '../../src/interfaces/domain/IQuestion';

describe('AnswerValidator', () => {
  let validator: AnswerValidator;
  let singleAnswerQuestion: IQuestion;
  let multipleAnswerQuestion: IQuestion;

  beforeEach(() => {
    validator = new AnswerValidator();

    // Create a single-answer question
    const singleOptions = [
      new Option('1', 'Option A'),
      new Option('2', 'Option B'),
      new Option('3', 'Option C'),
      new Option('4', 'Option D')
    ];
    
    singleAnswerQuestion = new MultipleChoiceQuestion(
      'single-q1',
      'What is 2 + 2?',
      singleOptions,
      [1], // Correct answer is index 1 (Option B)
      'The answer is 4',
      'math',
      'easy'
    );

    // Create a multiple-answer question
    const multipleOptions = [
      new Option('1', 'Option A'),
      new Option('2', 'Option B'),
      new Option('3', 'Option C'),
      new Option('4', 'Option D')
    ];
    
    multipleAnswerQuestion = new MultipleChoiceQuestion(
      'multi-q1',
      'Which are even numbers?',
      multipleOptions,
      [0, 1], // Correct answers are indices 0 and 1
      'Both A and B are even',
      'math',
      'medium'
    );
  });

  describe('validate', () => {
    it('should return valid result for correct single answer', () => {
      const result = validator.validate(singleAnswerQuestion, [1]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.isCorrect).toBe(true);
      expect(result.metadata?.selectedAnswers).toEqual([1]);
      expect(result.metadata?.correctAnswers).toEqual([1]);
    });

    it('should return valid result for incorrect single answer', () => {
      const result = validator.validate(singleAnswerQuestion, [0]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.isCorrect).toBe(false);
      expect(result.metadata?.selectedAnswers).toEqual([0]);
      expect(result.metadata?.correctAnswers).toEqual([1]);
    });

    it('should return valid result for correct multiple answers', () => {
      const result = validator.validate(multipleAnswerQuestion, [0, 1]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.isCorrect).toBe(true);
      expect(result.metadata?.selectedAnswers).toEqual([0, 1]);
      expect(result.metadata?.correctAnswers).toEqual([0, 1]);
    });

    it('should return invalid result for out-of-bounds indices', () => {
      const result = validator.validate(singleAnswerQuestion, [5]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer index 5 is out of bounds. Maximum valid index is 3');
      expect(result.metadata?.isCorrect).toBe(false);
    });

    it('should return invalid result for empty selection', () => {
      const result = validator.validate(singleAnswerQuestion, []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one answer must be selected');
    });

    it('should return invalid result for multiple selections on single-answer question', () => {
      const result = validator.validate(singleAnswerQuestion, [0, 1]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('This question expects a single answer, but 2 answers were selected');
    });
  });

  describe('validateAnswerIndices', () => {
    it('should validate correct indices', () => {
      const result = validator.validateAnswerIndices(singleAnswerQuestion, [0, 1, 2]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative indices', () => {
      const result = validator.validateAnswerIndices(singleAnswerQuestion, [-1]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer index cannot be negative, got: -1');
    });

    it('should reject out-of-bounds indices', () => {
      const result = validator.validateAnswerIndices(singleAnswerQuestion, [4]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer index 4 is out of bounds. Maximum valid index is 3');
    });

    it('should reject non-integer indices', () => {
      const result = validator.validateAnswerIndices(singleAnswerQuestion, [1.5]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer index must be an integer, got: 1.5');
    });

    it('should handle multiple invalid indices', () => {
      const result = validator.validateAnswerIndices(singleAnswerQuestion, [-1, 4, 1.5]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Answer index cannot be negative, got: -1');
      expect(result.errors).toContain('Answer index 4 is out of bounds. Maximum valid index is 3');
      expect(result.errors).toContain('Answer index must be an integer, got: 1.5');
    });
  });

  describe('validateSelectionCount', () => {
    it('should validate single selection for single-answer question', () => {
      const result = validator.validateSelectionCount(singleAnswerQuestion, [1]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate multiple selections for multiple-answer question', () => {
      const result = validator.validateSelectionCount(multipleAnswerQuestion, [0, 1]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty selection', () => {
      const result = validator.validateSelectionCount(singleAnswerQuestion, []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one answer must be selected');
    });

    it('should reject multiple selections for single-answer question', () => {
      const result = validator.validateSelectionCount(singleAnswerQuestion, [0, 1]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('This question expects a single answer, but 2 answers were selected');
    });

    it('should reject duplicate selections', () => {
      const result = validator.validateSelectionCount(multipleAnswerQuestion, [0, 0, 1]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate answer selections are not allowed');
    });

    it('should reject selecting more options than available', () => {
      const result = validator.validateSelectionCount(singleAnswerQuestion, [0, 1, 2, 3, 4]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('This question expects a single answer, but 5 answers were selected');
    });
  });

  describe('isCorrectAnswer', () => {
    it('should return true for correct single answer', () => {
      const result = validator.isCorrectAnswer(singleAnswerQuestion, [1]);
      expect(result).toBe(true);
    });

    it('should return false for incorrect single answer', () => {
      const result = validator.isCorrectAnswer(singleAnswerQuestion, [0]);
      expect(result).toBe(false);
    });

    it('should return true for correct multiple answers', () => {
      const result = validator.isCorrectAnswer(multipleAnswerQuestion, [0, 1]);
      expect(result).toBe(true);
    });

    it('should return true for correct multiple answers in different order', () => {
      const result = validator.isCorrectAnswer(multipleAnswerQuestion, [1, 0]);
      expect(result).toBe(true);
    });

    it('should return false for partial correct answers', () => {
      const result = validator.isCorrectAnswer(multipleAnswerQuestion, [0]);
      expect(result).toBe(false);
    });

    it('should return false for incorrect multiple answers', () => {
      const result = validator.isCorrectAnswer(multipleAnswerQuestion, [2, 3]);
      expect(result).toBe(false);
    });

    it('should return false for too many answers', () => {
      const result = validator.isCorrectAnswer(singleAnswerQuestion, [0, 1]);
      expect(result).toBe(false);
    });

    it('should return false for empty selection', () => {
      const result = validator.isCorrectAnswer(singleAnswerQuestion, []);
      expect(result).toBe(false);
    });
  });
});