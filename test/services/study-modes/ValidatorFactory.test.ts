// Test-Driven Development - Tests for ValidatorFactory
// Tests SOLID principles and design patterns

import { describe, test, expect, beforeEach } from 'vitest';
import type { Question, FlipCardQuestion, MultipleChoiceQuestion } from '../../../src/utils/types';
import { ValidatorFactory, CompositeValidator } from '../../../src/services/study-modes/ValidatorFactory';
import { FlipCardValidator } from '../../../src/services/study-modes/FlipCardValidator';
import { MultipleChoiceValidator } from '../../../src/services/study-modes/MultipleChoiceValidator';

describe('ValidatorFactory', () => {
  let factory: ValidatorFactory;

  beforeEach(() => {
    factory = new ValidatorFactory();
  });

  describe('createValidator', () => {
    test('should create FlipCardValidator for flip-card questions', () => {
      const validator = factory.createValidator('flip-card');
      expect(validator).toBeInstanceOf(FlipCardValidator);
    });

    test('should create MultipleChoiceValidator for multiple-choice questions', () => {
      const validator = factory.createValidator('multiple-choice');
      expect(validator).toBeInstanceOf(MultipleChoiceValidator);
    });

    test('should return null for unsupported question types', () => {
      const validator = factory.createValidator('unsupported' as any);
      expect(validator).toBeNull();
    });
  });

  describe('getSupportedTypes', () => {
    test('should return all supported question types', () => {
      const supportedTypes = factory.getSupportedTypes();
      expect(supportedTypes).toContain('flip-card');
      expect(supportedTypes).toContain('multiple-choice');
      expect(supportedTypes).toHaveLength(2);
    });
  });

  describe('isSupported', () => {
    test('should return true for supported types', () => {
      expect(factory.isSupported('flip-card')).toBe(true);
      expect(factory.isSupported('multiple-choice')).toBe(true);
    });

    test('should return false for unsupported types', () => {
      expect(factory.isSupported('unsupported' as any)).toBe(false);
    });
  });

  describe('registerValidator', () => {
    test('should allow registering new validator types', () => {
      const customValidator = () => new FlipCardValidator();
      factory.registerValidator('custom' as any, customValidator);
      
      expect(factory.isSupported('custom' as any)).toBe(true);
      expect(factory.getSupportedTypes()).toContain('custom' as any);
    });
  });

  describe('createCompositeValidator', () => {
    test('should create composite validator for multiple types', () => {
      const composite = factory.createCompositeValidator(['flip-card', 'multiple-choice']);
      
      expect(composite).toBeInstanceOf(CompositeValidator);
      expect(composite.getSupportedTypes()).toContain('flip-card');
      expect(composite.getSupportedTypes()).toContain('multiple-choice');
    });
  });

  describe('createOptimalValidator', () => {
    const flipCardQuestion: FlipCardQuestion = {
      id: 'test-1',
      type: 'flip-card',
      question: 'Test question',
      answer: 'Test answer',
      category: 'basics',
      subcategory: 'test',
      difficulty: 5,
      tags: ['test'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      version: 1
    };

    const mcQuestion: MultipleChoiceQuestion = {
      id: 'test-2',
      type: 'multiple-choice',
      question: 'Test MC question',
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' }
      ],
      correctAnswerIndex: 0,
      category: 'basics',
      subcategory: 'test',
      difficulty: 5,
      tags: ['test'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      version: 1
    };

    test('should create specific validator for single question type', () => {
      const validator = factory.createOptimalValidator([flipCardQuestion]);
      expect(validator).toBeInstanceOf(FlipCardValidator);
    });

    test('should create composite validator for mixed question types', () => {
      const validator = factory.createOptimalValidator([flipCardQuestion, mcQuestion]);
      expect(validator).toBeInstanceOf(CompositeValidator);
    });

    test('should throw error for unsupported question types', () => {
      const unsupportedQuestion = { ...flipCardQuestion, type: 'unsupported' } as any;
      
      expect(() => {
        factory.createOptimalValidator([unsupportedQuestion]);
      }).toThrow();
    });
  });
});

describe('CompositeValidator', () => {
  let flipCardValidator: FlipCardValidator;
  let mcValidator: MultipleChoiceValidator;
  let composite: CompositeValidator;

  beforeEach(() => {
    flipCardValidator = new FlipCardValidator();
    mcValidator = new MultipleChoiceValidator();
    
    const validators = new Map();
    validators.set('flip-card', flipCardValidator);
    validators.set('multiple-choice', mcValidator);
    
    composite = new CompositeValidator(validators);
  });

  test('should delegate to appropriate validator based on question type', () => {
    const flipCardQuestion: FlipCardQuestion = {
      id: 'test-1',
      type: 'flip-card',
      question: 'Test question',
      answer: 'Test answer',
      category: 'basics',
      subcategory: 'test',
      difficulty: 5,
      tags: ['test'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      version: 1
    };

    expect(composite.canValidate(flipCardQuestion)).toBe(true);
  });

  test('should return correct max scores for different question types', () => {
    const flipCardQuestion: FlipCardQuestion = {
      id: 'test-1',
      type: 'flip-card',
      question: 'Test question',
      answer: 'Test answer',
      category: 'basics',
      subcategory: 'test',
      difficulty: 5,
      tags: ['test'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      version: 1
    };

    const mcQuestion: MultipleChoiceQuestion = {
      id: 'test-2',
      type: 'multiple-choice',
      question: 'Test MC question',
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' }
      ],
      correctAnswerIndex: 0,
      category: 'basics',
      subcategory: 'test',
      difficulty: 5,
      tags: ['test'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      version: 1
    };

    expect(composite.getMaxScore(flipCardQuestion)).toBe(1);
    expect(composite.getMaxScore(mcQuestion)).toBe(1.2);
  });

  test('should throw error for unsupported question types', () => {
    const unsupportedQuestion = {
      id: 'test-3',
      type: 'unsupported',
      question: 'Test question'
    } as any;

    expect(() => {
      composite.validateAnswer(unsupportedQuestion, {} as any);
    }).toThrow();
  });
});