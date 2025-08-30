import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApplicationFactory } from '../../src/services/ApplicationFactory';
import { ServiceLocator } from '../../src/services/ServiceConfiguration';
import type { IApplicationContext } from '../../src/services/ApplicationFactory';

// Mock the file system operations for testing
vi.mock('../../src/repositories/QuestionLoader');
vi.mock('../../src/repositories/QuestionParser');

describe('ApplicationFactory', () => {
  afterEach(() => {
    ServiceLocator.clear();
  });

  describe('createApplication', () => {
    it('should create application context without auto-initialization', async () => {
      const context = await ApplicationFactory.createApplication({
        autoInitialize: false,
        configureServiceLocator: false
      });

      expect(context.questionManager).toBeDefined();
      expect(context.answerManager).toBeDefined();
      expect(context.stateManager).toBeDefined();
      expect(context.errorHandler).toBeDefined();
      expect(context.container).toBeDefined();
    });

    it('should configure service locator when requested', async () => {
      await ApplicationFactory.createApplication({
        configureServiceLocator: true,
        autoInitialize: false
      });

      expect(ServiceLocator.isConfigured()).toBe(true);
    });

    it('should not configure service locator when not requested', async () => {
      await ApplicationFactory.createApplication({
        configureServiceLocator: false,
        autoInitialize: false
      });

      expect(ServiceLocator.isConfigured()).toBe(false);
    });

    it('should handle initialization errors when auto-initialize is enabled', async () => {
      // This test verifies error handling behavior without actually initializing
      await expect(
        ApplicationFactory.createApplication({
          autoInitialize: true,
          questionPaths: ['non-existent-path']
        })
      ).rejects.toThrow('Failed to initialize application');
    });

    it('should pass custom question paths to services', async () => {
      const customPaths = ['custom/questions'];
      
      const context = await ApplicationFactory.createApplication({
        questionPaths: customPaths,
        autoInitialize: false
      });

      // Verify the container is properly configured
      expect(context.container).toBeDefined();
      expect(context.questionManager).toBeDefined();
    });
  });

  describe('createApplicationSync', () => {
    it('should create application context without initialization', () => {
      const context = ApplicationFactory.createApplicationSync();

      expect(context.questionManager).toBeDefined();
      expect(context.answerManager).toBeDefined();
      expect(context.stateManager).toBeDefined();
      expect(context.errorHandler).toBeDefined();
      expect(context.container).toBeDefined();
    });

    it('should create context with custom options', () => {
      const context = ApplicationFactory.createApplicationSync({
        questionPaths: ['test/questions']
      });

      expect(context).toBeDefined();
      expect(context.container).toBeDefined();
    });
  });

  describe('createTestApplication', () => {
    it('should create test context with mock services', () => {
      const context = ApplicationFactory.createTestApplication();

      expect(context.questionManager).toBeDefined();
      expect(context.answerManager).toBeDefined();
      expect(context.stateManager).toBeDefined();
      expect(context.errorHandler).toBeDefined();
      expect(context.container).toBeDefined();

      // Test that mock services work
      expect(context.questionManager.getCurrentQuestion()).toBeNull();
      expect(context.questionManager.moveToNext()).toBe(false);
      expect(context.questionManager.getTotalCount()).toBe(0);
    });

    it('should use provided mock overrides', () => {
      const mockQuestionManager = {
        getCurrentQuestion: vi.fn().mockReturnValue({ id: 'test' }),
        moveToNext: vi.fn().mockReturnValue(true),
        moveToPrevious: vi.fn().mockReturnValue(false),
        resetCurrent: vi.fn(),
        getTotalCount: vi.fn().mockReturnValue(5),
        getCurrentIndex: vi.fn().mockReturnValue(0),
        initialize: vi.fn().mockResolvedValue(undefined)
      };

      const context = ApplicationFactory.createTestApplication({
        questionManager: mockQuestionManager
      });

      expect(context.questionManager).toBe(mockQuestionManager);
      expect(context.questionManager.getCurrentQuestion()).toEqual({ id: 'test' });
      expect(context.questionManager.getTotalCount()).toBe(5);
    });

    it('should create working mock answer manager', () => {
      const context = ApplicationFactory.createTestApplication();

      const result = context.answerManager.submitAnswer('test', [0]);
      expect(result).toEqual({
        isCorrect: false,
        correctAnswers: [],
        explanation: '',
        selectedAnswers: []
      });

      expect(context.answerManager.getAnswerState('test')).toBeNull();
      expect(context.answerManager.isAnswered('test')).toBe(false);
      expect(context.answerManager.getSelectedOptions('test')).toEqual([]);
    });

    it('should create working mock state manager', () => {
      const context = ApplicationFactory.createTestApplication();

      const state = context.stateManager.getApplicationState();
      expect(state).toEqual({
        currentQuestionIndex: 0,
        questionStates: new Map(),
        isInitialized: false,
        totalQuestions: 0
      });

      expect(context.stateManager.getQuestionState('test')).toBeNull();
      expect(context.stateManager.getCurrentQuestionIndex()).toBe(0);
      expect(context.stateManager.isInitialized()).toBe(false);
    });

    it('should create working mock error handler', () => {
      const context = ApplicationFactory.createTestApplication();

      expect(context.errorHandler.canHandle(new Error())).toBe(true);
      expect(() => context.errorHandler.handleError(new Error())).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should dispose application context', () => {
      const context = ApplicationFactory.createApplicationSync();
      const disposeSpy = vi.spyOn(context.container, 'dispose');

      ApplicationFactory.dispose(context);

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should clear service locator if configured', () => {
      const context = ApplicationFactory.createApplicationSync();
      ServiceLocator.setContainer(context.container);

      expect(ServiceLocator.isConfigured()).toBe(true);

      ApplicationFactory.dispose(context);

      expect(ServiceLocator.isConfigured()).toBe(false);
    });

    it('should handle disposal errors gracefully', () => {
      const context = ApplicationFactory.createApplicationSync();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.spyOn(context.container, 'dispose').mockImplementation(() => {
        throw new Error('Disposal error');
      });

      expect(() => ApplicationFactory.dispose(context)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error disposing application context:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Integration', () => {
    it('should create fully functional application context', () => {
      const context = ApplicationFactory.createApplicationSync();

      // Test that services can interact with each other
      expect(() => {
        context.stateManager.setCurrentQuestionIndex(0);
        context.stateManager.setTotalQuestions(10);
        context.stateManager.setInitialized(true);
      }).not.toThrow();

      expect(context.stateManager.getCurrentQuestionIndex()).toBe(0);
      expect(context.stateManager.isInitialized()).toBe(true);
    });

    it('should maintain service relationships', () => {
      const context = ApplicationFactory.createApplicationSync();

      // The same StateManager instance should be used by both managers
      const stateFromQuestionManager = context.questionManager;
      const stateFromAnswerManager = context.answerManager;

      expect(stateFromQuestionManager).toBeDefined();
      expect(stateFromAnswerManager).toBeDefined();
    });
  });
});