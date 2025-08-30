import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { QuestionManager } from '../../src/services/QuestionManager';
import type { IQuestionRepository } from '../../src/interfaces/repositories/IQuestionRepository';
import type { IShuffleService } from '../../src/interfaces/services/IShuffleService';
import type { IStateManager } from '../../src/interfaces/services/IStateManager';
import type { IQuestion } from '../../src/interfaces/domain/IQuestion';
import { MultipleChoiceQuestion } from '../../src/models/MultipleChoiceQuestion';
import { Option } from '../../src/models/Option';

describe('QuestionManager', () => {
  let questionManager: QuestionManager;
  let mockQuestionRepository: jest.Mocked<IQuestionRepository>;
  let mockShuffleService: jest.Mocked<IShuffleService>;
  let mockStateManager: jest.Mocked<IStateManager>;
  let mockQuestions: IQuestion[];

  beforeEach(() => {
    // Create mock repository
    mockQuestionRepository = {
      loadQuestions: vi.fn(),
      getQuestionById: vi.fn(),
      getQuestionsByCategory: vi.fn()
    } as jest.Mocked<IQuestionRepository>;

    // Create mock shuffle service
    mockShuffleService = {
      shuffleQuestions: vi.fn(),
      shuffleQuestionOptions: vi.fn(),
      shuffleOptionsWithMapping: vi.fn(),
      mapAnswerIndices: vi.fn()
    } as jest.Mocked<IShuffleService>;

    // Create mock state manager
    mockStateManager = {
      getCurrentQuestionIndex: vi.fn(),
      setCurrentQuestionIndex: vi.fn(),
      setTotalQuestions: vi.fn(),
      setInitialized: vi.fn(),
      getApplicationState: vi.fn(),
      updateQuestionState: vi.fn(),
      resetApplicationState: vi.fn()
    } as jest.Mocked<IStateManager>;

    // Create mock questions
    mockQuestions = [
      new MultipleChoiceQuestion(
        '1',
        'What is the output of Console.WriteLine("Hello");?',
        [
          new Option('a', 'Hello'),
          new Option('b', 'World'),
          new Option('c', 'Error'),
          new Option('d', 'Nothing')
        ],
        [0],
        'Console.WriteLine outputs the string to console',
        'basics',
        'easy'
      ),
      new MultipleChoiceQuestion(
        '2',
        'Which keyword is used to declare a variable?',
        [
          new Option('a', 'var'),
          new Option('b', 'let'),
          new Option('c', 'const'),
          new Option('d', 'int')
        ],
        [0, 3],
        'Both var and int can be used to declare variables',
        'basics',
        'medium'
      ),
      new MultipleChoiceQuestion(
        '3',
        'What is inheritance?',
        [
          new Option('a', 'A way to create objects'),
          new Option('b', 'A way to reuse code'),
          new Option('c', 'A way to hide data'),
          new Option('d', 'A way to organize code')
        ],
        [1],
        'Inheritance allows code reuse through class hierarchies',
        'oop',
        'hard'
      )
    ];

    // Set up default mock behavior
    mockQuestionRepository.loadQuestions.mockResolvedValue(mockQuestions);
    mockStateManager.getCurrentQuestionIndex.mockReturnValue(0);
    
    // Set up shuffle service mock behavior (return questions unchanged for most tests)
    mockShuffleService.shuffleQuestions.mockImplementation((questions) => [...questions]);
    mockShuffleService.shuffleQuestionOptions.mockImplementation((question) => question);

    questionManager = new QuestionManager(mockQuestionRepository, mockShuffleService, mockStateManager);
  });

  describe('initialization', () => {
    it('should initialize successfully with valid questions', async () => {
      await questionManager.initialize();

      expect(mockQuestionRepository.loadQuestions).toHaveBeenCalledOnce();
      expect(mockStateManager.setTotalQuestions).toHaveBeenCalledWith(3);
      expect(mockStateManager.setInitialized).toHaveBeenCalledWith(true);
    });

    it('should throw error when initializing twice', async () => {
      await questionManager.initialize();

      await expect(questionManager.initialize()).rejects.toThrow(
        'QuestionManager is already initialized'
      );
    });

    it('should throw error when no questions are available', async () => {
      mockQuestionRepository.loadQuestions.mockResolvedValue([]);

      await expect(questionManager.initialize()).rejects.toThrow(
        'No questions available to load'
      );
    });

    it('should throw error when repository fails to load questions', async () => {
      const repositoryError = new Error('Database connection failed');
      mockQuestionRepository.loadQuestions.mockRejectedValue(repositoryError);

      await expect(questionManager.initialize()).rejects.toThrow(
        'Failed to initialize QuestionManager: Database connection failed'
      );
    });

    it('should handle unknown errors during initialization', async () => {
      mockQuestionRepository.loadQuestions.mockRejectedValue('Unknown error');

      await expect(questionManager.initialize()).rejects.toThrow(
        'Failed to initialize QuestionManager: Unknown error'
      );
    });
  });

  describe('getCurrentQuestion', () => {
    it('should return null when not initialized', () => {
      const result = questionManager.getCurrentQuestion();
      expect(result).toBeNull();
    });

    it('should return null when no questions are loaded', async () => {
      mockQuestionRepository.loadQuestions.mockResolvedValue([]);
      
      try {
        await questionManager.initialize();
      } catch {
        // Expected to fail due to no questions
      }

      const result = questionManager.getCurrentQuestion();
      expect(result).toBeNull();
    });

    it('should return first question after initialization', async () => {
      await questionManager.initialize();

      const result = questionManager.getCurrentQuestion();
      expect(result).toBe(mockQuestions[0]);
    });

    it('should return correct question based on state manager index', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(1);
      await questionManager.initialize();

      const result = questionManager.getCurrentQuestion();
      expect(result).toBe(mockQuestions[1]);
    });

    it('should return null when current index is out of bounds (negative)', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(-1);
      await questionManager.initialize();

      const result = questionManager.getCurrentQuestion();
      expect(result).toBeNull();
    });

    it('should return null when current index is out of bounds (too high)', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(10);
      await questionManager.initialize();

      const result = questionManager.getCurrentQuestion();
      expect(result).toBeNull();
    });
  });

  describe('moveToNext', () => {
    it('should throw error when not initialized', () => {
      expect(() => questionManager.moveToNext()).toThrow(
        'QuestionManager must be initialized before use'
      );
    });

    it('should move to next question successfully', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(0);
      await questionManager.initialize();

      const result = questionManager.moveToNext();

      expect(result).toBe(true);
      expect(mockStateManager.setCurrentQuestionIndex).toHaveBeenCalledWith(1);
    });

    it('should move through multiple questions', async () => {
      mockStateManager.getCurrentQuestionIndex
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1);
      await questionManager.initialize();

      const firstMove = questionManager.moveToNext();
      const secondMove = questionManager.moveToNext();

      expect(firstMove).toBe(true);
      expect(secondMove).toBe(true);
      expect(mockStateManager.setCurrentQuestionIndex).toHaveBeenCalledWith(1);
      expect(mockStateManager.setCurrentQuestionIndex).toHaveBeenCalledWith(2);
    });

    it('should return false when at last question', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(2); // Last question (index 2)
      await questionManager.initialize();

      const result = questionManager.moveToNext();

      expect(result).toBe(false);
      expect(mockStateManager.setCurrentQuestionIndex).not.toHaveBeenCalled();
    });

    it('should return false when beyond last question', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(5); // Beyond bounds
      await questionManager.initialize();

      const result = questionManager.moveToNext();

      expect(result).toBe(false);
      expect(mockStateManager.setCurrentQuestionIndex).not.toHaveBeenCalled();
    });
  });

  describe('moveToPrevious', () => {
    it('should throw error when not initialized', () => {
      expect(() => questionManager.moveToPrevious()).toThrow(
        'QuestionManager must be initialized before use'
      );
    });

    it('should move to previous question successfully', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(2);
      await questionManager.initialize();

      const result = questionManager.moveToPrevious();

      expect(result).toBe(true);
      expect(mockStateManager.setCurrentQuestionIndex).toHaveBeenCalledWith(1);
    });

    it('should move through multiple questions backwards', async () => {
      mockStateManager.getCurrentQuestionIndex
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(1);
      await questionManager.initialize();

      const firstMove = questionManager.moveToPrevious();
      const secondMove = questionManager.moveToPrevious();

      expect(firstMove).toBe(true);
      expect(secondMove).toBe(true);
      expect(mockStateManager.setCurrentQuestionIndex).toHaveBeenCalledWith(1);
      expect(mockStateManager.setCurrentQuestionIndex).toHaveBeenCalledWith(0);
    });

    it('should return false when at first question', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(0);
      await questionManager.initialize();

      const result = questionManager.moveToPrevious();

      expect(result).toBe(false);
      expect(mockStateManager.setCurrentQuestionIndex).not.toHaveBeenCalled();
    });

    it('should return false when before first question', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(-1);
      await questionManager.initialize();

      const result = questionManager.moveToPrevious();

      expect(result).toBe(false);
      expect(mockStateManager.setCurrentQuestionIndex).not.toHaveBeenCalled();
    });
  });

  describe('resetCurrent', () => {
    it('should throw error when not initialized', () => {
      expect(() => questionManager.resetCurrent()).toThrow(
        'QuestionManager must be initialized before use'
      );
    });

    it('should throw error when no current question', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(-1);
      await questionManager.initialize();

      expect(() => questionManager.resetCurrent()).toThrow(
        'No current question to reset'
      );
    });

    it('should reset current question successfully', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(1);
      await questionManager.initialize();

      expect(() => questionManager.resetCurrent()).not.toThrow();
    });

    it('should not affect question navigation state', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(1);
      await questionManager.initialize();

      questionManager.resetCurrent();

      // Verify that the current index hasn't changed
      expect(mockStateManager.setCurrentQuestionIndex).not.toHaveBeenCalled();
    });
  });

  describe('getTotalCount', () => {
    it('should return 0 when not initialized', () => {
      const result = questionManager.getTotalCount();
      expect(result).toBe(0);
    });

    it('should return correct count after initialization', async () => {
      await questionManager.initialize();

      const result = questionManager.getTotalCount();
      expect(result).toBe(3);
    });

    it('should return 0 when no questions loaded', async () => {
      mockQuestionRepository.loadQuestions.mockResolvedValue([]);
      
      try {
        await questionManager.initialize();
      } catch {
        // Expected to fail
      }

      const result = questionManager.getTotalCount();
      expect(result).toBe(0);
    });
  });

  describe('getCurrentIndex', () => {
    it('should return -1 when not initialized', () => {
      const result = questionManager.getCurrentIndex();
      expect(result).toBe(-1);
    });

    it('should return current index from state manager', async () => {
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(2);
      await questionManager.initialize();

      const result = questionManager.getCurrentIndex();
      expect(result).toBe(2);
    });

    it('should reflect changes in state manager', async () => {
      mockStateManager.getCurrentQuestionIndex
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1);
      await questionManager.initialize();

      const firstResult = questionManager.getCurrentIndex();
      const secondResult = questionManager.getCurrentIndex();

      expect(firstResult).toBe(0);
      expect(secondResult).toBe(1);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty question array gracefully', async () => {
      mockQuestionRepository.loadQuestions.mockResolvedValue([]);

      await expect(questionManager.initialize()).rejects.toThrow();
      
      expect(questionManager.getCurrentQuestion()).toBeNull();
      expect(questionManager.getTotalCount()).toBe(0);
      expect(questionManager.getCurrentIndex()).toBe(-1);
    });

    it('should maintain state consistency after failed operations', async () => {
      await questionManager.initialize();
      
      // Try to move beyond bounds
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(2);
      const moveResult = questionManager.moveToNext();
      
      expect(moveResult).toBe(false);
      expect(questionManager.getCurrentQuestion()).toBe(mockQuestions[2]);
    });

    it('should handle state manager returning invalid indices', async () => {
      await questionManager.initialize();
      
      // State manager returns invalid index
      mockStateManager.getCurrentQuestionIndex.mockReturnValue(100);
      
      expect(questionManager.getCurrentQuestion()).toBeNull();
      expect(questionManager.getCurrentIndex()).toBe(100);
    });
  });

  describe('Single Responsibility Principle compliance', () => {
    it('should only handle question navigation, not answer state', async () => {
      await questionManager.initialize();
      
      // QuestionManager should not have methods for answer management
      expect(questionManager).not.toHaveProperty('submitAnswer');
      expect(questionManager).not.toHaveProperty('validateAnswer');
      expect(questionManager).not.toHaveProperty('getAnswerState');
    });

    it('should delegate state management to StateManager', async () => {
      await questionManager.initialize();
      
      questionManager.moveToNext();
      questionManager.moveToPrevious();
      
      // Verify all state changes go through StateManager
      expect(mockStateManager.setCurrentQuestionIndex).toHaveBeenCalled();
      expect(mockStateManager.getCurrentQuestionIndex).toHaveBeenCalled();
    });

    it('should delegate question loading to QuestionRepository', async () => {
      await questionManager.initialize();
      
      // Verify question loading is delegated to repository
      expect(mockQuestionRepository.loadQuestions).toHaveBeenCalledOnce();
    });
  });

  describe('randomization functionality', () => {
    it('should call shuffle service when randomization is enabled', async () => {
      await questionManager.initialize({ shuffleQuestions: true, shuffleOptions: true });
      
      expect(mockShuffleService.shuffleQuestions).toHaveBeenCalledWith(mockQuestions);
      expect(mockShuffleService.shuffleQuestionOptions).toHaveBeenCalledTimes(mockQuestions.length);
    });

    it('should not call shuffle service when randomization is disabled', async () => {
      vi.clearAllMocks();
      await questionManager.initialize({ shuffleQuestions: false, shuffleOptions: false });
      
      expect(mockShuffleService.shuffleQuestions).not.toHaveBeenCalled();
      expect(mockShuffleService.shuffleQuestionOptions).not.toHaveBeenCalled();
    });
  });
});