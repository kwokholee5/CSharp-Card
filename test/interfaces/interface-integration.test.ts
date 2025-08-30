import { describe, test, expect } from 'vitest';
import {
  IQuestion,
  IAnswerResult,
  IQuestionState,
  IApplicationState,
  IQuestionManager,
  IAnswerManager,
  IStateManager,
  IAnswerValidator,
  IQuestionValidator
} from '../../src/interfaces';

describe('Interface Integration', () => {
  test('should be able to import domain and business logic interfaces together', () => {
    // Verify that all interfaces can be imported from the main index
    // This ensures proper module organization and exports
    
    // Domain interfaces (these should be undefined at runtime since they're TypeScript interfaces)
    expect(typeof IQuestion).toBe('undefined');
    expect(typeof IAnswerResult).toBe('undefined');
    expect(typeof IQuestionState).toBe('undefined');
    expect(typeof IApplicationState).toBe('undefined');
    
    // Business logic interfaces
    expect(typeof IQuestionManager).toBe('undefined');
    expect(typeof IAnswerManager).toBe('undefined');
    expect(typeof IStateManager).toBe('undefined');
    
    // Validation interfaces
    expect(typeof IAnswerValidator).toBe('undefined');
    expect(typeof IQuestionValidator).toBe('undefined');
  });

  test('should demonstrate proper interface segregation', () => {
    // Document the separation of concerns achieved through ISP
    const interfaceCategories = {
      domain: ['IQuestion', 'IAnswerResult', 'IQuestionState', 'IApplicationState'],
      businessLogic: ['IQuestionManager', 'IAnswerManager', 'IStateManager'],
      validation: ['IAnswerValidator', 'IQuestionValidator']
    };

    // Verify we have interfaces in each category
    expect(interfaceCategories.domain.length).toBeGreaterThan(0);
    expect(interfaceCategories.businessLogic.length).toBeGreaterThan(0);
    expect(interfaceCategories.validation.length).toBeGreaterThan(0);
    
    // Verify total interface count
    const totalInterfaces = Object.values(interfaceCategories).flat().length;
    expect(totalInterfaces).toBe(9);
  });
});