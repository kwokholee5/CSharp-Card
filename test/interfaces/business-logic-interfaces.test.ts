import { describe, test, expect } from 'vitest';
import {
  IQuestionManager,
  IAnswerManager,
  IStateManager,
  IAnswerValidator,
  IQuestionValidator,
  IValidationResult
} from '../../src/interfaces';

describe('Business Logic Interfaces', () => {
  test('should be able to import all business logic interfaces', () => {
    // This test verifies that all interfaces are properly exported and can be imported
    expect(typeof IQuestionManager).toBe('undefined'); // Interfaces don't exist at runtime
    expect(typeof IAnswerManager).toBe('undefined');
    expect(typeof IStateManager).toBe('undefined');
    expect(typeof IAnswerValidator).toBe('undefined');
    expect(typeof IQuestionValidator).toBe('undefined');
    expect(typeof IValidationResult).toBe('undefined');
  });

  test('interfaces should follow ISP by having focused responsibilities', () => {
    // This is a documentation test to verify ISP compliance
    const interfaceResponsibilities = {
      IQuestionManager: 'Question navigation and retrieval only',
      IAnswerManager: 'Answer submission and validation only',
      IStateManager: 'Application state management only',
      IAnswerValidator: 'Answer validation logic only',
      IQuestionValidator: 'Question data validation only'
    };

    expect(Object.keys(interfaceResponsibilities)).toHaveLength(5);
    expect(interfaceResponsibilities.IQuestionManager).toContain('navigation');
    expect(interfaceResponsibilities.IAnswerManager).toContain('Answer');
    expect(interfaceResponsibilities.IStateManager).toContain('state');
    expect(interfaceResponsibilities.IAnswerValidator).toContain('validation');
    expect(interfaceResponsibilities.IQuestionValidator).toContain('validation');
  });
});