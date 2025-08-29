# Dependency Injection Container

This directory contains the dependency injection (DI) container implementation for the C# Interview Webapp. The DI system follows SOLID principles and provides a clean way to manage service dependencies throughout the application.

## Overview

The DI container system consists of three main components:

1. **DIContainer** - Core container for service registration and resolution
2. **ServiceConfiguration** - Configuration and registration of all application services
3. **ApplicationFactory** - Factory for creating configured application instances

## Key Features

- **Type-safe service resolution** using TypeScript generics and symbols
- **Singleton and transient lifetimes** for service instances
- **Circular dependency detection** to prevent infinite loops
- **Factory pattern** for service creation with dependency injection
- **Service locator pattern** for global service access (optional)
- **Child containers** for hierarchical service management
- **Automatic disposal** of services that implement dispose methods

## Core Classes

### DIContainer

The main dependency injection container that manages service registration and resolution.

```typescript
import { DIContainer } from './DIContainer';

const container = new DIContainer();

// Register services
container.registerSingleton('IUserService', () => new UserService());
container.registerTransient('ILogger', () => new Logger());

// Resolve services
const userService = container.resolve<IUserService>('IUserService');
```

### ServiceConfiguration

Configures all application services with their dependencies.

```typescript
import { configureServices, ServiceIdentifiers } from './ServiceConfiguration';

const container = new DIContainer();
configureServices(container, {
  questionPaths: ['data/questions']
});

const questionManager = container.resolve(ServiceIdentifiers.QuestionManager);
```

### ApplicationFactory

Factory for creating fully configured application instances.

```typescript
import { ApplicationFactory } from './ApplicationFactory';

// Create application with auto-initialization
const app = await ApplicationFactory.createApplication({
  questionPaths: ['data/questions'],
  autoInitialize: true,
  configureServiceLocator: true
});

// Use services
const currentQuestion = app.questionManager.getCurrentQuestion();
```

## Service Registration Patterns

### Basic Registration

```typescript
// Singleton (default)
container.registerSingleton('ServiceId', () => new Service());

// Transient
container.registerTransient('ServiceId', () => new Service());

// Instance
container.registerInstance('ServiceId', existingInstance);
```

### Dependency Injection

```typescript
// Service with dependencies
container.registerSingleton('IUserService', (container) => {
  const logger = container.resolve<ILogger>('ILogger');
  const database = container.resolve<IDatabase>('IDatabase');
  return new UserService(logger, database);
});
```

### Interface-based Registration

```typescript
// Using symbols for type safety
const IUserService = Symbol('IUserService');
container.registerSingleton<IUserService>(IUserService, () => new UserService());

const userService = container.resolve<IUserService>(IUserService);
```

## Service Identifiers

All application services are registered using predefined symbols for type safety:

```typescript
export const ServiceIdentifiers = {
  QuestionManager: Symbol('IQuestionManager'),
  AnswerManager: Symbol('IAnswerManager'),
  StateManager: Symbol('IStateManager'),
  QuestionRepository: Symbol('IQuestionRepository'),
  // ... more services
} as const;
```

## Usage Patterns

### 1. Application Setup

```typescript
// Create fully configured application
const app = await ApplicationFactory.createApplication({
  questionPaths: ['data/questions'],
  autoInitialize: true
});

// Use services directly
const question = app.questionManager.getCurrentQuestion();
const result = app.answerManager.submitAnswer('q1', [0]);
```

### 2. Service Locator Pattern

```typescript
// Configure global service locator
const app = await ApplicationFactory.createApplication({
  configureServiceLocator: true
});

// Access services globally
const questionManager = ServiceLocator.get(ServiceIdentifiers.QuestionManager);
const answerManager = ServiceLocator.get(ServiceIdentifiers.AnswerManager);
```

### 3. Testing with Mocks

```typescript
// Create test application with mocks
const testApp = ApplicationFactory.createTestApplication({
  questionManager: mockQuestionManager,
  answerManager: mockAnswerManager
});

// Use in tests
expect(testApp.questionManager.getCurrentQuestion()).toBe(mockQuestion);
```

### 4. Custom Configuration

```typescript
// Create container with custom services
const container = new DIContainer();
configureServices(container, {
  questionPaths: ['custom/path']
});

// Override specific services
container.registerWithOverride('CustomService', () => new CustomService(), 'singleton', true);
```

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- Each service class has one clear responsibility
- DIContainer only manages service registration/resolution
- ServiceConfiguration only handles service setup

### Open/Closed Principle (OCP)
- New services can be added without modifying existing code
- Container supports extension through new registrations
- Factory pattern allows new creation strategies

### Liskov Substitution Principle (LSP)
- All service implementations can replace their interfaces
- Mock services are interchangeable with real implementations
- Child containers can substitute parent containers

### Interface Segregation Principle (ISP)
- Services depend only on interfaces they use
- Small, focused interfaces (IQuestionManager, IAnswerManager, etc.)
- No forced dependencies on unused methods

### Dependency Inversion Principle (DIP)
- High-level modules depend on abstractions (interfaces)
- Concrete implementations are injected via DI
- Business logic is independent of infrastructure details

## Error Handling

The DI container includes comprehensive error handling:

```typescript
// Circular dependency detection
container.registerSingleton('A', (c) => c.resolve('B'));
container.registerSingleton('B', (c) => c.resolve('A'));
// Throws: "Circular dependency detected: A -> B -> A"

// Missing service detection
container.resolve('NonExistentService');
// Throws: "Service with identifier 'NonExistentService' is not registered"

// Duplicate registration prevention
container.registerSingleton('Service', () => new Service());
container.registerSingleton('Service', () => new Service());
// Throws: "Service with identifier 'Service' is already registered"
```

## Best Practices

### 1. Use Interfaces
Always register and resolve services using interfaces rather than concrete classes:

```typescript
// Good
container.registerSingleton<IUserService>('IUserService', () => new UserService());

// Avoid
container.registerSingleton('UserService', () => new UserService());
```

### 2. Prefer Constructor Injection
Design services to receive dependencies through constructors:

```typescript
class UserService implements IUserService {
  constructor(
    private readonly logger: ILogger,
    private readonly database: IDatabase
  ) {}
}
```

### 3. Use Symbols for Type Safety
Use symbols instead of strings for service identifiers:

```typescript
// Good
const IUserService = Symbol('IUserService');

// Avoid
const userServiceId = 'UserService';
```

### 4. Dispose Resources
Always dispose of application contexts when done:

```typescript
const app = await ApplicationFactory.createApplication();
try {
  // Use application
} finally {
  ApplicationFactory.dispose(app);
}
```

### 5. Test with Mocks
Use the test application factory for unit testing:

```typescript
const testApp = ApplicationFactory.createTestApplication({
  questionManager: mockQuestionManager
});
```

## Examples

See `src/examples/DIContainerExample.ts` for comprehensive usage examples including:
- Basic application setup
- Service locator usage
- Custom configuration
- Test application creation
- Error handling patterns

## Architecture Benefits

1. **Maintainability** - Clear separation of concerns and dependencies
2. **Testability** - Easy mocking and dependency substitution
3. **Flexibility** - Services can be easily swapped or extended
4. **Type Safety** - Full TypeScript support with compile-time checking
5. **Performance** - Singleton services reduce object creation overhead
6. **Debugging** - Clear error messages and dependency tracking