/**
 * Example demonstrating how to use the Dependency Injection Container
 * This file shows practical usage patterns for the DI system
 */

import { ApplicationFactory } from '../services/ApplicationFactory';
import { ServiceLocator, ServiceIdentifiers } from '../services/ServiceConfiguration';
import type { IQuestionManager } from '../interfaces/services/IQuestionManager';
import type { IAnswerManager } from '../interfaces/services/IAnswerManager';

/**
 * Example 1: Basic Application Setup
 * Shows how to create a fully configured application
 */
export async function basicApplicationSetup() {
  console.log('=== Basic Application Setup ===');
  
  try {
    // Create application with default configuration
    const app = await ApplicationFactory.createApplication({
      questionPaths: ['data/questions'],
      autoInitialize: false, // Don't auto-initialize for this example
      configureServiceLocator: true
    });

    console.log('✓ Application created successfully');
    console.log('✓ Services available:', {
      questionManager: !!app.questionManager,
      answerManager: !!app.answerManager,
      stateManager: !!app.stateManager,
      errorHandler: !!app.errorHandler
    });

    // Clean up
    ApplicationFactory.dispose(app);
    console.log('✓ Application disposed');
    
  } catch (error) {
    console.error('✗ Failed to create application:', error);
  }
}

/**
 * Example 2: Using Service Locator Pattern
 * Shows how to access services globally using the service locator
 */
export async function serviceLocatorExample() {
  console.log('\n=== Service Locator Example ===');
  
  try {
    // Create application with service locator enabled
    const app = await ApplicationFactory.createApplication({
      autoInitialize: false,
      configureServiceLocator: true
    });

    // Access services through service locator
    const questionManager = ServiceLocator.get<IQuestionManager>(ServiceIdentifiers.QuestionManager);
    const answerManager = ServiceLocator.get<IAnswerManager>(ServiceIdentifiers.AnswerManager);

    console.log('✓ Services accessed via ServiceLocator');
    console.log('✓ QuestionManager total count:', questionManager.getTotalCount());
    console.log('✓ AnswerManager available:', !!answerManager);

    // Clean up
    ApplicationFactory.dispose(app);
    console.log('✓ Service locator cleared');
    
  } catch (error) {
    console.error('✗ Service locator example failed:', error);
  }
}

/**
 * Example 3: Custom Configuration
 * Shows how to create application with custom settings
 */
export async function customConfigurationExample() {
  console.log('\n=== Custom Configuration Example ===');
  
  try {
    // Create application with custom question paths
    const app = await ApplicationFactory.createApplication({
      questionPaths: ['custom/questions', 'additional/questions'],
      autoInitialize: false,
      configureServiceLocator: false
    });

    console.log('✓ Application created with custom configuration');
    
    // Access services directly from context
    const questionManager = app.questionManager;
    const stateManager = app.stateManager;

    // Configure initial state
    stateManager.setTotalQuestions(10);
    stateManager.setCurrentQuestionIndex(0);
    stateManager.setInitialized(true);

    console.log('✓ Initial state configured');
    console.log('✓ Current state:', {
      currentIndex: stateManager.getCurrentQuestionIndex(),
      totalQuestions: stateManager.getApplicationState().totalQuestions,
      isInitialized: stateManager.isInitialized()
    });

    // Clean up
    ApplicationFactory.dispose(app);
    console.log('✓ Custom application disposed');
    
  } catch (error) {
    console.error('✗ Custom configuration example failed:', error);
  }
}

/**
 * Example 4: Test Application Setup
 * Shows how to create mock application for testing
 */
export function testApplicationExample() {
  console.log('\n=== Test Application Example ===');
  
  try {
    // Create test application with mocks
    const testApp = ApplicationFactory.createTestApplication();

    console.log('✓ Test application created');
    
    // Use mock services
    const mockQuestion = testApp.questionManager.getCurrentQuestion();
    const mockAnswerResult = testApp.answerManager.submitAnswer('test-id', [0]);
    
    console.log('✓ Mock services working:', {
      currentQuestion: mockQuestion,
      answerResult: mockAnswerResult
    });

    // Test with custom mocks
    const customTestApp = ApplicationFactory.createTestApplication({
      questionManager: {
        getCurrentQuestion: () => ({ 
          id: 'custom-test', 
          text: 'Custom test question',
          options: [],
          category: 'test',
          difficulty: 'easy' as const,
          explanation: 'Test explanation',
          codeExample: undefined,
          getCorrectAnswers: () => [0],
          hasMultipleCorrectAnswers: () => false
        }),
        moveToNext: () => true,
        moveToPrevious: () => false,
        resetCurrent: () => {},
        getTotalCount: () => 5,
        getCurrentIndex: () => 0,
        initialize: async () => {}
      }
    });

    const customQuestion = customTestApp.questionManager.getCurrentQuestion();
    console.log('✓ Custom mock question:', customQuestion?.text);

    // Clean up
    ApplicationFactory.dispose(testApp);
    ApplicationFactory.dispose(customTestApp);
    console.log('✓ Test applications disposed');
    
  } catch (error) {
    console.error('✗ Test application example failed:', error);
  }
}

/**
 * Example 5: Error Handling
 * Shows how the DI system handles errors
 */
export async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');
  
  try {
    // Create application and demonstrate error handling
    const app = await ApplicationFactory.createApplication({
      autoInitialize: false,
      configureServiceLocator: false
    });

    // Use error handler
    const errorHandler = app.errorHandler;
    
    // Test error handling
    const testError = new Error('Test error for demonstration');
    console.log('✓ Testing error handler...');
    errorHandler.handleError(testError);
    console.log('✓ Error handled successfully');

    // Clean up
    ApplicationFactory.dispose(app);
    console.log('✓ Error handling example completed');
    
  } catch (error) {
    console.error('✗ Error handling example failed:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running Dependency Injection Container Examples\n');
  
  await basicApplicationSetup();
  await serviceLocatorExample();
  await customConfigurationExample();
  testApplicationExample();
  await errorHandlingExample();
  
  console.log('\n✅ All examples completed!');
}

// Export for use in other files or direct execution
export default {
  basicApplicationSetup,
  serviceLocatorExample,
  customConfigurationExample,
  testApplicationExample,
  errorHandlingExample,
  runAllExamples
};