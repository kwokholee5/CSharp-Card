/**
 * Service configuration for dependency injection container.
 * Configures all service registrations following Dependency Inversion Principle.
 * Implements factory pattern for service creation with proper dependency injection.
 */

import { DIContainer } from './DIContainer';

// Import interfaces
import type { IQuestionManager } from '../interfaces/services/IQuestionManager';
import type { IAnswerManager } from '../interfaces/services/IAnswerManager';
import type { IStateManager } from '../interfaces/services/IStateManager';
import type { IQuestionRepository } from '../interfaces/repositories/IQuestionRepository';
import type { IQuestionLoader } from '../interfaces/repositories/IQuestionLoader';
import type { IQuestionParser } from '../interfaces/repositories/IQuestionParser';
import type { IAnswerValidator } from '../interfaces/validation/IAnswerValidator';
import type { IErrorHandler } from '../interfaces/errors/IErrorHandler';
import type { IApplicationBootstrap } from '../interfaces/services/IApplicationBootstrap';

// Import concrete implementations
import { QuestionManager } from './QuestionManager';
import { AnswerManager } from './AnswerManager';
import { StateManager } from './StateManager';
import { JsonQuestionRepository } from '../repositories/JsonQuestionRepository';
import { QuestionLoader } from '../repositories/QuestionLoader';
import { QuestionParser } from '../repositories/QuestionParser';
import { AnswerValidator } from './AnswerValidator';
import { ApplicationErrorHandler } from './ErrorHandler';
import { ApplicationBootstrap } from './ApplicationBootstrap';

/**
 * Service identifiers for type-safe service resolution
 */
export const ServiceIdentifiers = {
  // Services
  QuestionManager: Symbol('IQuestionManager'),
  AnswerManager: Symbol('IAnswerManager'),
  StateManager: Symbol('IStateManager'),
  ApplicationBootstrap: Symbol('IApplicationBootstrap'),
  
  // Repositories
  QuestionRepository: Symbol('IQuestionRepository'),
  QuestionLoader: Symbol('IQuestionLoader'),
  QuestionParser: Symbol('IQuestionParser'),
  
  // Validators
  AnswerValidator: Symbol('IAnswerValidator'),
  
  // Error Handling
  ErrorHandler: Symbol('IErrorHandler'),
  
  // Configuration
  QuestionPaths: Symbol('QuestionPaths')
} as const;

/**
 * Configuration options for service registration
 */
export interface ServiceConfigurationOptions {
  /**
   * Paths to question JSON files or directories
   */
  questionPaths?: string[];
}

/**
 * Configures all services in the dependency injection container
 * @param container - The DI container to configure
 * @param options - Configuration options for services
 */
export function configureServices(
  container: DIContainer,
  options: ServiceConfigurationOptions = {}
): void {
  const {
    questionPaths = [
      'data/questions/basics/data-types-mc.json'
    ]
  } = options;

  // Register configuration values
  container.registerInstance(ServiceIdentifiers.QuestionPaths, questionPaths);

  // Register data access layer services
  registerDataAccessServices(container);
  
  // Register validation services
  registerValidationServices(container);
  
  // Register business logic services
  registerBusinessLogicServices(container);
  
  // Register error handling services
  registerErrorHandlingServices(container);
  
  // Register bootstrap services
  registerBootstrapServices(container);
}

/**
 * Registers data access layer services (repositories, loaders, parsers)
 * @param container - The DI container to register services with
 */
function registerDataAccessServices(container: DIContainer): void {
  // Register QuestionLoader as singleton
  container.registerSingleton<IQuestionLoader>(
    ServiceIdentifiers.QuestionLoader,
    () => new QuestionLoader()
  );

  // Register QuestionParser as singleton
  container.registerSingleton<IQuestionParser>(
    ServiceIdentifiers.QuestionParser,
    () => new QuestionParser()
  );

  // Register QuestionRepository as singleton with dependencies
  container.registerSingleton<IQuestionRepository>(
    ServiceIdentifiers.QuestionRepository,
    (container: DIContainer) => {
      const questionLoader = container.resolve<IQuestionLoader>(ServiceIdentifiers.QuestionLoader);
      const questionParser = container.resolve<IQuestionParser>(ServiceIdentifiers.QuestionParser);
      const questionPaths = container.resolve<string[]>(ServiceIdentifiers.QuestionPaths);
      
      return new JsonQuestionRepository(questionLoader, questionParser, questionPaths);
    }
  );
}

/**
 * Registers validation services
 * @param container - The DI container to register services with
 */
function registerValidationServices(container: DIContainer): void {
  // Register AnswerValidator as singleton
  container.registerSingleton<IAnswerValidator>(
    ServiceIdentifiers.AnswerValidator,
    () => new AnswerValidator()
  );
}

/**
 * Registers business logic services (managers)
 * @param container - The DI container to register services with
 */
function registerBusinessLogicServices(container: DIContainer): void {
  // Register StateManager as singleton
  container.registerSingleton<IStateManager>(
    ServiceIdentifiers.StateManager,
    () => new StateManager()
  );

  // Register QuestionManager as singleton with dependencies
  container.registerSingleton<IQuestionManager>(
    ServiceIdentifiers.QuestionManager,
    (container: DIContainer) => {
      const questionRepository = container.resolve<IQuestionRepository>(ServiceIdentifiers.QuestionRepository);
      const stateManager = container.resolve<IStateManager>(ServiceIdentifiers.StateManager);
      
      return new QuestionManager(questionRepository, stateManager);
    }
  );

  // Register AnswerManager as singleton with dependencies
  container.registerSingleton<IAnswerManager>(
    ServiceIdentifiers.AnswerManager,
    (container: DIContainer) => {
      const answerValidator = container.resolve<IAnswerValidator>(ServiceIdentifiers.AnswerValidator);
      const stateManager = container.resolve<IStateManager>(ServiceIdentifiers.StateManager);
      const questionManager = container.resolve<IQuestionManager>(ServiceIdentifiers.QuestionManager);
      
      return new AnswerManager(answerValidator, stateManager, questionManager);
    }
  );
}

/**
 * Registers error handling services
 * @param container - The DI container to register services with
 */
function registerErrorHandlingServices(container: DIContainer): void {
  // Register ErrorHandler as singleton
  container.registerSingleton<IErrorHandler>(
    ServiceIdentifiers.ErrorHandler,
    () => new ApplicationErrorHandler()
  );
}

/**
 * Registers bootstrap services
 * @param container - The DI container to register services with
 */
function registerBootstrapServices(container: DIContainer): void {
  // Register ApplicationBootstrap as singleton with dependencies
  container.registerSingleton<IApplicationBootstrap>(
    ServiceIdentifiers.ApplicationBootstrap,
    (container: DIContainer) => {
      const questionRepository = container.resolve<IQuestionRepository>(ServiceIdentifiers.QuestionRepository);
      const stateManager = container.resolve<IStateManager>(ServiceIdentifiers.StateManager);
      const errorHandler = container.resolve<IErrorHandler>(ServiceIdentifiers.ErrorHandler);
      
      return new ApplicationBootstrap(questionRepository, stateManager, errorHandler);
    }
  );
}

/**
 * Creates and configures a new DI container with all services
 * @param options - Configuration options for services
 * @returns Configured DI container
 */
export function createConfiguredContainer(
  options: ServiceConfigurationOptions = {}
): DIContainer {
  const container = new DIContainer();
  configureServices(container, options);
  return container;
}

/**
 * Service locator pattern implementation for easy service access
 * Note: This is provided for convenience but direct DI is preferred
 */
export class ServiceLocator {
  private static container: DIContainer | null = null;

  /**
   * Sets the container for the service locator
   * @param container - The configured DI container
   */
  static setContainer(container: DIContainer): void {
    ServiceLocator.container = container;
  }

  /**
   * Gets a service from the configured container
   * @param identifier - Service identifier
   * @returns The resolved service instance
   * @throws Error if no container is configured or service is not found
   */
  static get<T>(identifier: symbol): T {
    if (!ServiceLocator.container) {
      throw new Error('ServiceLocator container is not configured. Call setContainer() first.');
    }
    
    return ServiceLocator.container.resolve<T>(identifier);
  }

  /**
   * Checks if the service locator has a configured container
   * @returns True if container is configured, false otherwise
   */
  static isConfigured(): boolean {
    return ServiceLocator.container !== null;
  }

  /**
   * Clears the configured container
   */
  static clear(): void {
    ServiceLocator.container = null;
  }
}