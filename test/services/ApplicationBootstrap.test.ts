import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApplicationBootstrap } from '../../src/services/ApplicationBootstrap';
import type { IQuestionRepository } from '../../src/interfaces/repositories/IQuestionRepository';
import type { IStateManager } from '../../src/interfaces/services/IStateManager';
import type { IErrorHandler } from '../../src/interfaces/errors/IErrorHandler';
import type { IQuestion } from '../../src/interfaces/domain/IQuestion';

describe('ApplicationBootstrap', () => {
  let bootstrap: ApplicationBootstrap;
  let mockQuestionRepository: IQuestionRepository;
  let mockStateManager: IStateManager;
  let mockErrorHandler: IErrorHandler;
  let mockQuestions: IQuestion[];

  beforeEach(() => {
    // Create mock questions
    mockQuestions = [
      {
        id: 'test-1',
        text: 'Test question 1',
        options: [],
        category: 'test',
        difficulty: 'easy' as const,
        explanation: 'Test explanation',
        getCorrectAnswers: () => [0],
        hasMultipleCorrectAnswers: () => false
      }
    ];

    // Create mock repository
    mockQuestionRepository = {
      loadQuestions: vi.fn().mockResolvedValue(mockQuestions),
      getQuestionById: vi.fn(),
      getQuestionsByCategory: vi.fn(),
      getTotalCount: vi.fn().mockResolvedValue(mockQuestions.length),
      reset: vi.fn(),
      getAvailableCategories: vi.fn()
    };

    // Create mock state manager
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

    // Create mock error handler
    mockErrorHandler = {
      handleError: vi.fn(),
      canHandle: vi.fn().mockReturnValue(true)
    };

    bootstrap = new ApplicationBootstrap(
      mockQuestionRepository,
      mockStateManager,
      mockErrorHandler
    );
  });

  describe('initialize', () => {
    it('should successfully initialize with default options', async () => {
      const result = await bootstrap.initialize();

      expect(result.success).toBe(true);
      expect(result.questionsLoaded).toBe(1);
      expect(result.filesProcessed).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should call progress callback during initialization', async () => {
      const onProgress = vi.fn();

      await bootstrap.initialize({
        onProgress
      });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'discovering',
          message: 'Discovering question files...',
          progress: 10
        })
      );

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'complete',
          progress: 100
        })
      );
    });

    it('should handle repository loading errors', async () => {
      const loadError = new Error('Failed to load questions');
      vi.mocked(mockQuestionRepository.loadQuestions).mockRejectedValue(loadError);

      const result = await bootstrap.initialize();

      expect(result.success).toBe(false);
      expect(result.errors).toContain(loadError);
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should retry on failure when enabled', async () => {
      vi.mocked(mockQuestionRepository.loadQuestions)
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(mockQuestions);

      const result = await bootstrap.initialize({
        enableRetry: true,
        maxRetries: 2,
        retryDelay: 10
      });

      expect(result.success).toBe(true);
      expect(mockQuestionRepository.loadQuestions).toHaveBeenCalledTimes(3); // Called during validation too
    });

    it('should validate loaded questions', async () => {
      vi.mocked(mockQuestionRepository.getTotalCount).mockResolvedValue(0);

      const result = await bootstrap.initialize();

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.message.includes('validation failed'))).toBe(true);
    });
  });

  describe('attemptRecovery', () => {
    it('should attempt recovery with minimal configuration', async () => {
      const originalError = new Error('Original initialization failed');

      const result = await bootstrap.attemptRecovery(originalError);

      expect(result.success).toBe(true);
      expect(mockQuestionRepository.loadQuestions).toHaveBeenCalled();
    });

    it('should handle recovery failure', async () => {
      const originalError = new Error('Original initialization failed');
      const recoveryError = new Error('Recovery also failed');
      
      vi.mocked(mockQuestionRepository.loadQuestions).mockRejectedValue(recoveryError);

      const result = await bootstrap.attemptRecovery(originalError);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toBe(originalError);
      expect(result.errors[1]).toBe(recoveryError);
    });
  });
});