import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnswerManager } from '../../src/services/AnswerManager';
import { MultipleChoiceQuestion } from '../../src/models/MultipleChoiceQuestion';
import { Option } from '../../src/models/Option';
import type { IAnswerValidator } from '../../src/interfaces/validation/IAnswerValidator';
import type { IStateManager } from '../../src/interfaces/services/IStateManager';
import type { IQuestionManager } from '../../src/interfaces/services/IQuestionManager';
import type { IQuestion } from '../../src/interfaces/domain/IQuestion';
import type { IValidationResult } from '../../src/interfaces/validation/IValidationResult';
import type { IQuestionState } from '../../src/interfaces/domain/types';

describe('AnswerManager', () => {
  let answerManager: AnswerManager;
  let mockValidator: jest.Mocked<IAnswerValidator>;
  let mockStateManager: jest.Mocked<IStateManager>;
  let mockQuestionManager: jest.Mocked<IQuestionManager>;
  let testQuestion: IQuestion;

  beforeEach(() => {
    // Create test question
    const options = [
      new Option('1', 'Option A'),
      new Option('2', 'Option B'),
      new Option('3', 'Option C'),
      new Option('4', 'Option D')
    ];
    
    testQuestion = new MultipleChoiceQuestion(
      'test-q1',
      'What is 2 + 2?',
      options,
      [1], // Correct answer is index 1
      'The answer is 4',
      'math',
      'easy'
    );

    // Create mocks
    mockValidator = {
      validate: vi.fn(),
      validateAnswerIndices: vi.fn(),
      validateSelectionCount: vi.fn(),
      isCorrectAnswer: vi.fn()
    };

    mockStateManager = {
      getApplicationState: vi.fn(),
      updateQuestionState: vi.fn(),
      getQuestionState: vi.fn(),
      resetApplicationState: vi.fn(),
      setCurrentQuestionIndex: vi.fn(),
      getCurrentQuestionIndex: vi.fn(),
      setTotalQuestions: vi.fn(),
      setInitialized: vi.fn(),
      isInitialized: vi.fn()
    };

    mockQuestionManager = {
      getCurrentQuestion: vi.fn(),
      moveToNext: vi.fn(),
      moveToPrevious: vi.fn(),
      resetCurrent: vi.fn(),
      getTotalCount: vi.fn(),
      getCurrentIndex: vi.fn(),
      initialize: vi.fn()
    };

    answerManager = new AnswerManager(mockValidator, mockStateManager, mockQuestionManager);
  });

  describe('submitAnswer', () => {
    it('should successfully submit a correct answer', () => {
      // Arrange
      mockQuestionManager.getCurrentQuestion.mockReturnValue(testQuestion);
      
      const validationResult: IValidationResult = {
        isValid: true,
        errors: [],
        metadata: { isCorrect: true }
      };
      mockValidator.validate.mockReturnValue(validationResult);

      // Act
      const result = answerManager.submitAnswer('test-q1', [1]);

      // Assert
      expect(result.isCorrect).toBe(true);
      expect(result.correctAnswers).toEqual([1]);
      expect(result.explanation).toBe('The answer is 4');
      expect(result.selectedAnswers).toEqual([1]);

      expect(mockValidator.validate).toHaveBeenCalledWith(testQuestion, [1]);
      expect(mockStateManager.updateQuestionState).toHaveBeenCalledWith('test-q1', {
        selectedAnswers: [1],
        isSubmitted: true,
        isCorrect: true,
        submittedAt: expect.any(Date)
      });
    });

    it('should successfully submit an incorrect answer', () => {
      // Arrange
      mockQuestionManager.getCurrentQuestion.mockReturnValue(testQuestion);
      
      const validationResult: IValidationResult = {
        isValid: true,
        errors: [],
        metadata: { isCorrect: false }
      };
      mockValidator.validate.mockReturnValue(validationResult);

      // Act
      const result = answerManager.submitAnswer('test-q1', [0]);

      // Assert
      expect(result.isCorrect).toBe(false);
      expect(result.correctAnswers).toEqual([1]);
      expect(result.explanation).toBe('The answer is 4');
      expect(result.selectedAnswers).toEqual([0]);

      expect(mockStateManager.updateQuestionState).toHaveBeenCalledWith('test-q1', {
        selectedAnswers: [0],
        isSubmitted: true,
        isCorrect: false,
        submittedAt: expect.any(Date)
      });
    });

    it('should throw error when no current question is available', () => {
      // Arrange
      mockQuestionManager.getCurrentQuestion.mockReturnValue(null);

      // Act & Assert
      expect(() => answerManager.submitAnswer('test-q1', [1]))
        .toThrow('No current question available');
    });

    it('should throw error when question ID does not match current question', () => {
      // Arrange
      mockQuestionManager.getCurrentQuestion.mockReturnValue(testQuestion);

      // Act & Assert
      expect(() => answerManager.submitAnswer('different-id', [1]))
        .toThrow('Question ID mismatch. Expected: different-id, Current: test-q1');
    });

    it('should throw error when validation fails', () => {
      // Arrange
      mockQuestionManager.getCurrentQuestion.mockReturnValue(testQuestion);
      
      const validationResult: IValidationResult = {
        isValid: false,
        errors: ['Answer index out of bounds']
      };
      mockValidator.validate.mockReturnValue(validationResult);

      // Act & Assert
      expect(() => answerManager.submitAnswer('test-q1', [5]))
        .toThrow('Answer validation failed: Answer index out of bounds');
    });

    it('should create defensive copies of selected answers', () => {
      // Arrange
      mockQuestionManager.getCurrentQuestion.mockReturnValue(testQuestion);
      
      const validationResult: IValidationResult = {
        isValid: true,
        errors: [],
        metadata: { isCorrect: true }
      };
      mockValidator.validate.mockReturnValue(validationResult);

      const selectedOptions = [1];

      // Act
      const result = answerManager.submitAnswer('test-q1', selectedOptions);

      // Modify original array
      selectedOptions.push(2);

      // Assert - result should not be affected by modification of original array
      expect(result.selectedAnswers).toEqual([1]);
      
      // Check that state manager received a copy
      const updateCall = mockStateManager.updateQuestionState.mock.calls[0];
      const stateParam = updateCall[1] as IQuestionState;
      expect(stateParam.selectedAnswers).toEqual([1]);
    });
  });

  describe('getAnswerState', () => {
    it('should return answer state from state manager', () => {
      // Arrange
      const expectedState: IQuestionState = {
        selectedAnswers: [1],
        isSubmitted: true,
        isCorrect: true,
        submittedAt: new Date()
      };
      mockStateManager.getQuestionState.mockReturnValue(expectedState);

      // Act
      const result = answerManager.getAnswerState('test-q1');

      // Assert
      expect(result).toBe(expectedState);
      expect(mockStateManager.getQuestionState).toHaveBeenCalledWith('test-q1');
    });

    it('should return null when no state exists', () => {
      // Arrange
      mockStateManager.getQuestionState.mockReturnValue(null);

      // Act
      const result = answerManager.getAnswerState('test-q1');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('resetAnswer', () => {
    it('should reset answer state to initial values', () => {
      // Act
      answerManager.resetAnswer('test-q1');

      // Assert
      expect(mockStateManager.updateQuestionState).toHaveBeenCalledWith('test-q1', {
        selectedAnswers: [],
        isSubmitted: false,
        isCorrect: false,
        submittedAt: undefined
      });
    });
  });

  describe('isAnswered', () => {
    it('should return true when question is submitted', () => {
      // Arrange
      const state: IQuestionState = {
        selectedAnswers: [1],
        isSubmitted: true,
        isCorrect: true,
        submittedAt: new Date()
      };
      mockStateManager.getQuestionState.mockReturnValue(state);

      // Act
      const result = answerManager.isAnswered('test-q1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when question is not submitted', () => {
      // Arrange
      const state: IQuestionState = {
        selectedAnswers: [1],
        isSubmitted: false,
        isCorrect: false
      };
      mockStateManager.getQuestionState.mockReturnValue(state);

      // Act
      const result = answerManager.isAnswered('test-q1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when no state exists', () => {
      // Arrange
      mockStateManager.getQuestionState.mockReturnValue(null);

      // Act
      const result = answerManager.isAnswered('test-q1');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getSelectedOptions', () => {
    it('should return selected options from state', () => {
      // Arrange
      const state: IQuestionState = {
        selectedAnswers: [0, 2],
        isSubmitted: true,
        isCorrect: false
      };
      mockStateManager.getQuestionState.mockReturnValue(state);

      // Act
      const result = answerManager.getSelectedOptions('test-q1');

      // Assert
      expect(result).toEqual([0, 2]);
    });

    it('should return empty array when no state exists', () => {
      // Arrange
      mockStateManager.getQuestionState.mockReturnValue(null);

      // Act
      const result = answerManager.getSelectedOptions('test-q1');

      // Assert
      expect(result).toEqual([]);
    });

    it('should return defensive copy of selected options', () => {
      // Arrange
      const state: IQuestionState = {
        selectedAnswers: [1, 2],
        isSubmitted: true,
        isCorrect: false
      };
      mockStateManager.getQuestionState.mockReturnValue(state);

      // Act
      const result = answerManager.getSelectedOptions('test-q1');

      // Modify returned array
      result.push(3);

      // Assert - original state should not be affected
      expect(state.selectedAnswers).toEqual([1, 2]);
      
      // Get fresh copy to verify
      const freshResult = answerManager.getSelectedOptions('test-q1');
      expect(freshResult).toEqual([1, 2]);
    });
  });
});