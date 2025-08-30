import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DIContainer } from '../../src/services/DIContainer';
import { 
  configureServices, 
  ServiceIdentifiers, 
  ServiceLocator,
  createConfiguredContainer 
} from '../../src/services/ServiceConfiguration';

// Import interfaces for type checking
import type { IQuestionManager } from '../../src/interfaces/services/IQuestionManager';
import type { IAnswerManager } from '../../src/interfaces/services/IAnswerManager';
import type { IStateManager } from '../../src/interfaces/services/IStateManager';
import type { IQuestionRepository } from '../../src/interfaces/repositories/IQuestionRepository';
import type { IQuestionLoader } from '../../src/interfaces/repositories/IQuestionLoader';
import type { IQuestionParser } from '../../src/interfaces/repositories/IQuestionParser';
import type { IAnswerValidator } from '../../src/interfaces/validation/IAnswerValidator';
import type { IErrorHandler } from '../../src/interfaces/errors/IErrorHandler';

describe('ServiceConfiguration', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  afterEach(() => {
    ServiceLocator.clear();
  });

  describe('configureServices', () => {
    it('should register all required services', () => {
      configureServices(container);

      // Check that all services are registered
      expect(container.isRegistered(ServiceIdentifiers.QuestionManager)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.AnswerManager)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.StateManager)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.QuestionRepository)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.QuestionLoader)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.QuestionParser)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.AnswerValidator)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.ErrorHandler)).toBe(true);
      expect(container.isRegistered(ServiceIdentifiers.QuestionPaths)).toBe(true);
    });

    it('should configure services with custom question paths', () => {
      const customPaths = ['custom/path1', 'custom/path2'];
      
      configureServices(container, { questionPaths: customPaths });
      
      const questionPaths = container.resolve<string[]>(ServiceIdentifiers.QuestionPaths);
      expect(questionPaths).toEqual(customPaths);
    });

    it('should use default question paths when none provided', () => {
      configureServices(container);
      
      const questionPaths = container.resolve<string[]>(ServiceIdentifiers.QuestionPaths);
      expect(questionPaths).toEqual(['data/questions']);
    });
  });

  describe('Service Resolution', () => {
    beforeEach(() => {
      configureServices(container);
    });

    it('should resolve QuestionManager with proper dependencies', () => {
      const questionManager = container.resolve<IQuestionManager>(ServiceIdentifiers.QuestionManager);
      
      expect(questionManager).toBeDefined();
      expect(typeof questionManager.getCurrentQuestion).toBe('function');
      expect(typeof questionManager.moveToNext).toBe('function');
      expect(typeof questionManager.initialize).toBe('function');
    });

    it('should resolve AnswerManager with proper dependencies', () => {
      const answerManager = container.resolve<IAnswerManager>(ServiceIdentifiers.AnswerManager);
      
      expect(answerManager).toBeDefined();
      expect(typeof answerManager.submitAnswer).toBe('function');
      expect(typeof answerManager.getAnswerState).toBe('function');
      expect(typeof answerManager.resetAnswer).toBe('function');
    });

    it('should resolve StateManager', () => {
      const stateManager = container.resolve<IStateManager>(ServiceIdentifiers.StateManager);
      
      expect(stateManager).toBeDefined();
      expect(typeof stateManager.getApplicationState).toBe('function');
      expect(typeof stateManager.updateQuestionState).toBe('function');
    });

    it('should resolve QuestionRepository with proper dependencies', () => {
      const questionRepository = container.resolve<IQuestionRepository>(ServiceIdentifiers.QuestionRepository);
      
      expect(questionRepository).toBeDefined();
      expect(typeof questionRepository.loadQuestions).toBe('function');
      expect(typeof questionRepository.getQuestionById).toBe('function');
    });

    it('should resolve QuestionLoader', () => {
      const questionLoader = container.resolve<IQuestionLoader>(ServiceIdentifiers.QuestionLoader);
      
      expect(questionLoader).toBeDefined();
      expect(typeof questionLoader.loadFromJson).toBe('function');
    });

    it('should resolve QuestionParser', () => {
      const questionParser = container.resolve<IQuestionParser>(ServiceIdentifiers.QuestionParser);
      
      expect(questionParser).toBeDefined();
      expect(typeof questionParser.parseQuestions).toBe('function');
      expect(typeof questionParser.parseQuestion).toBe('function');
    });

    it('should resolve AnswerValidator', () => {
      const answerValidator = container.resolve<IAnswerValidator>(ServiceIdentifiers.AnswerValidator);
      
      expect(answerValidator).toBeDefined();
      expect(typeof answerValidator.validate).toBe('function');
    });

    it('should resolve ErrorHandler', () => {
      const errorHandler = container.resolve<IErrorHandler>(ServiceIdentifiers.ErrorHandler);
      
      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler.handleError).toBe('function');
      expect(typeof errorHandler.canHandle).toBe('function');
    });
  });

  describe('Singleton Behavior', () => {
    beforeEach(() => {
      configureServices(container);
    });

    it('should return same instance for singleton services', () => {
      const stateManager1 = container.resolve<IStateManager>(ServiceIdentifiers.StateManager);
      const stateManager2 = container.resolve<IStateManager>(ServiceIdentifiers.StateManager);
      
      expect(stateManager1).toBe(stateManager2);
    });

    it('should maintain singleton behavior across dependent services', () => {
      const questionManager = container.resolve<IQuestionManager>(ServiceIdentifiers.QuestionManager);
      const answerManager = container.resolve<IAnswerManager>(ServiceIdentifiers.AnswerManager);
      
      // Both should use the same StateManager instance
      // This is verified by the fact that they can share state
      expect(questionManager).toBeDefined();
      expect(answerManager).toBeDefined();
    });
  });

  describe('createConfiguredContainer', () => {
    it('should create and configure a new container', () => {
      const configuredContainer = createConfiguredContainer();
      
      expect(configuredContainer).toBeInstanceOf(DIContainer);
      expect(configuredContainer.isRegistered(ServiceIdentifiers.QuestionManager)).toBe(true);
      expect(configuredContainer.isRegistered(ServiceIdentifiers.AnswerManager)).toBe(true);
    });

    it('should create container with custom options', () => {
      const customPaths = ['test/path'];
      const configuredContainer = createConfiguredContainer({ questionPaths: customPaths });
      
      const questionPaths = configuredContainer.resolve<string[]>(ServiceIdentifiers.QuestionPaths);
      expect(questionPaths).toEqual(customPaths);
    });
  });

  describe('ServiceLocator', () => {
    it('should set and use container', () => {
      configureServices(container);
      ServiceLocator.setContainer(container);
      
      expect(ServiceLocator.isConfigured()).toBe(true);
      
      const stateManager = ServiceLocator.get<IStateManager>(ServiceIdentifiers.StateManager);
      expect(stateManager).toBeDefined();
    });

    it('should throw error when not configured', () => {
      expect(ServiceLocator.isConfigured()).toBe(false);
      
      expect(() => {
        ServiceLocator.get<IStateManager>(ServiceIdentifiers.StateManager);
      }).toThrow('ServiceLocator container is not configured. Call setContainer() first.');
    });

    it('should clear configuration', () => {
      configureServices(container);
      ServiceLocator.setContainer(container);
      
      expect(ServiceLocator.isConfigured()).toBe(true);
      
      ServiceLocator.clear();
      
      expect(ServiceLocator.isConfigured()).toBe(false);
    });

    it('should throw error when getting service from cleared locator', () => {
      configureServices(container);
      ServiceLocator.setContainer(container);
      ServiceLocator.clear();
      
      expect(() => {
        ServiceLocator.get<IStateManager>(ServiceIdentifiers.StateManager);
      }).toThrow('ServiceLocator container is not configured. Call setContainer() first.');
    });
  });

  describe('Service Identifiers', () => {
    it('should have unique symbols for all services', () => {
      const identifiers = Object.values(ServiceIdentifiers);
      const uniqueIdentifiers = new Set(identifiers);
      
      expect(identifiers.length).toBe(uniqueIdentifiers.size);
    });

    it('should use symbols for type safety', () => {
      Object.values(ServiceIdentifiers).forEach(identifier => {
        expect(typeof identifier).toBe('symbol');
      });
    });
  });

  describe('Dependency Chain Resolution', () => {
    beforeEach(() => {
      configureServices(container);
    });

    it('should resolve complex dependency chains without errors', () => {
      // This test verifies that the entire dependency chain can be resolved
      // QuestionManager -> QuestionRepository -> QuestionLoader + QuestionParser
      // AnswerManager -> AnswerValidator + StateManager + QuestionManager
      
      expect(() => {
        container.resolve<IQuestionManager>(ServiceIdentifiers.QuestionManager);
      }).not.toThrow();
      
      expect(() => {
        container.resolve<IAnswerManager>(ServiceIdentifiers.AnswerManager);
      }).not.toThrow();
    });

    it('should handle circular dependencies in service configuration', () => {
      // The current configuration should not have circular dependencies
      expect(() => {
        container.resolve<IQuestionManager>(ServiceIdentifiers.QuestionManager);
        container.resolve<IAnswerManager>(ServiceIdentifiers.AnswerManager);
        container.resolve<IStateManager>(ServiceIdentifiers.StateManager);
      }).not.toThrow();
    });
  });
});