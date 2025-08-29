// Service implementations
export { QuestionManager } from './QuestionManager';
export { AnswerManager } from './AnswerManager';
export { AnswerValidator } from './AnswerValidator';
export { ShuffleService } from './ShuffleService';
export { StateManager } from './StateManager';
export { ApplicationErrorHandler, GlobalErrorHandler } from './ErrorHandler';

// Study Mode Services (business logic isolated)
export * from './study-modes';

// Dependency Injection
export { DIContainer, defaultContainer } from './DIContainer';
export { 
  configureServices, 
  ServiceIdentifiers, 
  ServiceLocator,
  createConfiguredContainer 
} from './ServiceConfiguration';
export { ApplicationFactory } from './ApplicationFactory';

// DI Types
export type { ServiceIdentifier } from './DIContainer';
export type { ServiceConfigurationOptions } from './ServiceConfiguration';
export type { 
  IApplicationContext, 
  ApplicationFactoryOptions 
} from './ApplicationFactory';