/**
 * Application factory implementing factory pattern for service creation.
 * Provides a clean interface for creating and initializing the application
 * with all dependencies properly configured through dependency injection.
 */

import { DIContainer } from './DIContainer';
import { 
  configureServices, 
  ServiceIdentifiers, 
  ServiceLocator,
  type ServiceConfigurationOptions 
} from './ServiceConfiguration';

// Import service interfaces
import type { IQuestionManager } from '../interfaces/services/IQuestionManager';
import type { IAnswerManager } from '../interfaces/services/IAnswerManager';
import type { IStateManager } from '../interfaces/services/IStateManager';
import type { IErrorHandler } from '../interfaces/errors/IErrorHandler';
import type { IApplicationBootstrap, BootstrapOptions, BootstrapResult, LoadingProgress } from '../interfaces/services/IApplicationBootstrap';

/**
 * Application context containing all configured services
 */
export interface IApplicationContext {
  readonly questionManager: IQuestionManager;
  readonly answerManager: IAnswerManager;
  readonly stateManager: IStateManager;
  readonly errorHandler: IErrorHandler;
  readonly applicationBootstrap: IApplicationBootstrap;
  readonly container: DIContainer;
}

/**
 * Configuration options for application creation
 */
export interface ApplicationFactoryOptions extends ServiceConfigurationOptions {
  /**
   * Whether to configure the global service locator
   * @default true
   */
  configureServiceLocator?: boolean;
  
  /**
   * Whether to automatically initialize the question manager
   * @default true
   */
  autoInitialize?: boolean;

  /**
   * Bootstrap options for question loading
   */
  bootstrapOptions?: BootstrapOptions;

  /**
   * Callback for loading progress updates
   */
  onLoadingProgress?: (progress: LoadingProgress) => void;
}

/**
 * Factory class for creating configured application instances
 */
export class ApplicationFactory {
  
  /**
   * Creates a new application context with all services configured
   * @param options - Configuration options for the application
   * @returns Promise resolving to configured application context
   */
  static async createApplication(
    options: ApplicationFactoryOptions = {}
  ): Promise<IApplicationContext> {
    const {
      configureServiceLocator = true,
      autoInitialize = true,
      bootstrapOptions = {},
      onLoadingProgress,
      ...serviceOptions
    } = options;

    // Create and configure DI container
    const container = new DIContainer();
    configureServices(container, serviceOptions);

    // Configure global service locator if requested
    if (configureServiceLocator) {
      ServiceLocator.setContainer(container);
    }

    // Resolve all main services
    const questionManager = container.resolve<IQuestionManager>(ServiceIdentifiers.QuestionManager);
    const answerManager = container.resolve<IAnswerManager>(ServiceIdentifiers.AnswerManager);
    const stateManager = container.resolve<IStateManager>(ServiceIdentifiers.StateManager);
    const errorHandler = container.resolve<IErrorHandler>(ServiceIdentifiers.ErrorHandler);
    const applicationBootstrap = container.resolve<IApplicationBootstrap>(ServiceIdentifiers.ApplicationBootstrap);

    // Auto-initialize using bootstrap if requested
    if (autoInitialize) {
      try {
        const bootstrapConfig: BootstrapOptions = {
          ...bootstrapOptions,
          onProgress: onLoadingProgress || bootstrapOptions.onProgress
        };

        const result = await applicationBootstrap.initialize(bootstrapConfig);
        
        if (!result.success) {
          const errorMessage = result.errors.length > 0 
            ? result.errors[0].message 
            : 'Unknown initialization error';
          throw new Error(`Failed to initialize application: ${errorMessage}`);
        }

        console.log(`Application initialized successfully: ${result.questionsLoaded} questions loaded in ${result.duration}ms`);
        
      } catch (error) {
        errorHandler.handleError(error as Error);
        
        // Attempt recovery
        console.log('Attempting recovery from initialization failure...');
        try {
          const recoveryResult = await applicationBootstrap.attemptRecovery(error as Error);
          if (recoveryResult.success) {
            console.log(`Recovery successful: ${recoveryResult.questionsLoaded} questions loaded`);
          } else {
            throw new Error(`Recovery failed: ${recoveryResult.errors.map(e => e.message).join(', ')}`);
          }
        } catch (recoveryError) {
          throw new Error(`Failed to initialize application: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Create application context
    const context: IApplicationContext = {
      questionManager,
      answerManager,
      stateManager,
      errorHandler,
      applicationBootstrap,
      container
    };

    return context;
  }

  /**
   * Creates a lightweight application context without auto-initialization
   * Useful for testing or when manual initialization is preferred
   * @param options - Configuration options for the application
   * @returns Configured application context (not initialized)
   */
  static createApplicationSync(
    options: ServiceConfigurationOptions = {}
  ): IApplicationContext {
    // Create and configure DI container
    const container = new DIContainer();
    configureServices(container, options);

    // Resolve all main services
    const questionManager = container.resolve<IQuestionManager>(ServiceIdentifiers.QuestionManager);
    const answerManager = container.resolve<IAnswerManager>(ServiceIdentifiers.AnswerManager);
    const stateManager = container.resolve<IStateManager>(ServiceIdentifiers.StateManager);
    const errorHandler = container.resolve<IErrorHandler>(ServiceIdentifiers.ErrorHandler);
    const applicationBootstrap = container.resolve<IApplicationBootstrap>(ServiceIdentifiers.ApplicationBootstrap);

    // Create application context
    const context: IApplicationContext = {
      questionManager,
      answerManager,
      stateManager,
      errorHandler,
      applicationBootstrap,
      container
    };

    return context;
  }

  /**
   * Creates a test application context with mock services
   * Useful for unit testing components that depend on application services
   * @param mockOverrides - Optional mock service overrides
   * @returns Test application context with mocked services
   */
  static createTestApplication(
    mockOverrides: Partial<{
      questionManager: IQuestionManager;
      answerManager: IAnswerManager;
      stateManager: IStateManager;
      errorHandler: IErrorHandler;
    }> = {}
  ): IApplicationContext {
    const container = new DIContainer();

    // Register mock services or create default mocks
    const questionManager = mockOverrides.questionManager || createMockQuestionManager();
    const answerManager = mockOverrides.answerManager || createMockAnswerManager();
    const stateManager = mockOverrides.stateManager || createMockStateManager();
    const errorHandler = mockOverrides.errorHandler || createMockErrorHandler();

    // Register mocks in container
    container.registerInstance(ServiceIdentifiers.QuestionManager, questionManager);
    container.registerInstance(ServiceIdentifiers.AnswerManager, answerManager);
    container.registerInstance(ServiceIdentifiers.StateManager, stateManager);
    container.registerInstance(ServiceIdentifiers.ErrorHandler, errorHandler);

    const applicationBootstrap = createMockApplicationBootstrap();
    container.registerInstance(ServiceIdentifiers.ApplicationBootstrap, applicationBootstrap);

    return {
      questionManager,
      answerManager,
      stateManager,
      errorHandler,
      applicationBootstrap,
      container
    };
  }

  /**
   * Disposes of an application context and cleans up resources
   * @param context - The application context to dispose
   */
  static dispose(context: IApplicationContext): void {
    try {
      // Clear service locator if it was configured
      if (ServiceLocator.isConfigured()) {
        ServiceLocator.clear();
      }

      // Dispose of the container (which will dispose singleton services)
      context.container.dispose();
    } catch (error) {
      console.error('Error disposing application context:', error);
    }
  }
}

/**
 * Creates a mock question manager for testing
 */
function createMockQuestionManager(): IQuestionManager {
  return {
    getCurrentQuestion: () => null,
    moveToNext: () => false,
    moveToPrevious: () => false,
    resetCurrent: () => {},
    getTotalCount: () => 0,
    getCurrentIndex: () => 0,
    initialize: async () => {}
  };
}

/**
 * Creates a mock answer manager for testing
 */
function createMockAnswerManager(): IAnswerManager {
  return {
    submitAnswer: () => ({
      isCorrect: false,
      correctAnswers: [],
      explanation: '',
      selectedAnswers: []
    }),
    getAnswerState: () => null,
    resetAnswer: () => {},
    isAnswered: () => false,
    getSelectedOptions: () => []
  };
}

/**
 * Creates a mock state manager for testing
 */
function createMockStateManager(): IStateManager {
  return {
    getApplicationState: () => ({
      currentQuestionIndex: 0,
      questionStates: new Map(),
      isInitialized: false,
      totalQuestions: 0
    }),
    updateQuestionState: () => {},
    getQuestionState: () => null,
    resetApplicationState: () => {},
    setCurrentQuestionIndex: () => {},
    getCurrentQuestionIndex: () => 0,
    setTotalQuestions: () => {},
    setInitialized: () => {},
    isInitialized: () => false
  };
}

/**
 * Creates a mock error handler for testing
 */
function createMockErrorHandler(): IErrorHandler {
  return {
    handleError: () => {},
    canHandle: () => true
  };
}

/**
 * Creates a mock application bootstrap for testing
 */
function createMockApplicationBootstrap(): IApplicationBootstrap {
  return {
    initialize: async () => ({
      success: true,
      questionsLoaded: 0,
      filesProcessed: 0,
      errors: [],
      duration: 0
    }),
    attemptRecovery: async () => ({
      success: true,
      questionsLoaded: 0,
      filesProcessed: 0,
      errors: [],
      duration: 0
    })
  };
}