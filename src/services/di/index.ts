/**
 * Dependency Injection module exports
 * Provides clean access to all DI-related functionality
 */

// Core DI container
export { DIContainer, defaultContainer } from '../DIContainer';
export type { ServiceIdentifier } from '../DIContainer';

// Service configuration
export { 
  configureServices, 
  ServiceIdentifiers, 
  ServiceLocator,
  createConfiguredContainer 
} from '../ServiceConfiguration';
export type { ServiceConfigurationOptions } from '../ServiceConfiguration';

// Application factory
export { ApplicationFactory } from '../ApplicationFactory';
export type { 
  IApplicationContext, 
  ApplicationFactoryOptions 
} from '../ApplicationFactory';