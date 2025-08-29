// Abstract Factory Pattern for creating appropriate validators
// Dependency Inversion Principle - depends on abstractions

import type { Question } from '../../utils/types';
import type { IAnswerValidator, IValidatorFactory } from './IAnswerValidator';
import { FlipCardValidator } from './FlipCardValidator';
import { MultipleChoiceValidator } from './MultipleChoiceValidator';

/**
 * Factory for creating answer validators based on question type
 * Implements Abstract Factory pattern
 */
export class ValidatorFactory implements IValidatorFactory {
  private validators: Map<Question['type'], () => IAnswerValidator>;

  constructor() {
    this.validators = new Map();
    this.registerDefaultValidators();
  }

  /**
   * Creates appropriate validator for the given question type
   */
  public createValidator(questionType: Question['type']): IAnswerValidator | null {
    const validatorFactory = this.validators.get(questionType);
    return validatorFactory ? validatorFactory() : null;
  }

  /**
   * Gets all supported question types
   */
  public getSupportedTypes(): Question['type'][] {
    return Array.from(this.validators.keys());
  }

  /**
   * Registers a new validator for a question type
   * Allows extending the factory with new question types
   */
  public registerValidator(
    questionType: Question['type'], 
    validatorFactory: () => IAnswerValidator
  ): void {
    this.validators.set(questionType, validatorFactory);
  }

  /**
   * Unregisters a validator for a question type
   */
  public unregisterValidator(questionType: Question['type']): boolean {
    return this.validators.delete(questionType);
  }

  /**
   * Checks if a question type is supported
   */
  public isSupported(questionType: Question['type']): boolean {
    return this.validators.has(questionType);
  }

  /**
   * Creates a composite validator that can handle multiple question types
   * Useful when you have mixed question types in a study session
   */
  public createCompositeValidator(questionTypes: Question['type'][]): CompositeValidator {
    const validators = new Map<Question['type'], IAnswerValidator>();
    
    for (const type of questionTypes) {
      const validator = this.createValidator(type);
      if (validator) {
        validators.set(type, validator);
      }
    }
    
    return new CompositeValidator(validators);
  }

  /**
   * Creates the best validator for a list of questions
   * Analyzes question types and returns appropriate validator
   */
  public createOptimalValidator(questions: Question[]): IAnswerValidator {
    const questionTypes = [...new Set(questions.map(q => q.type))];
    
    if (questionTypes.length === 1) {
      const validator = this.createValidator(questionTypes[0]);
      if (!validator) {
        throw new Error(`No validator available for question type: ${questionTypes[0]}`);
      }
      return validator;
    }
    
    // Multiple question types - use composite validator
    return this.createCompositeValidator(questionTypes);
  }

  private registerDefaultValidators(): void {
    this.registerValidator('flip-card', () => new FlipCardValidator());
    this.registerValidator('multiple-choice', () => new MultipleChoiceValidator());
  }
}

/**
 * Composite validator that delegates to appropriate validator based on question type
 * Implements Strategy pattern at runtime
 */
export class CompositeValidator implements IAnswerValidator {
  private validators: Map<Question['type'], IAnswerValidator>;

  constructor(validators: Map<Question['type'], IAnswerValidator>) {
    this.validators = validators;
  }

  public validateAnswer(question: Question, submission: any) {
    const validator = this.validators.get(question.type);
    if (!validator) {
      throw new Error(`No validator available for question type: ${question.type}`);
    }
    return validator.validateAnswer(question, submission);
  }

  public getMaxScore(question: Question): number {
    const validator = this.validators.get(question.type);
    if (!validator) {
      throw new Error(`No validator available for question type: ${question.type}`);
    }
    return validator.getMaxScore(question);
  }

  public canValidate(question: Question): boolean {
    return this.validators.has(question.type);
  }

  /**
   * Gets all supported question types
   */
  public getSupportedTypes(): Question['type'][] {
    return Array.from(this.validators.keys());
  }

  /**
   * Adds a validator for a new question type
   */
  public addValidator(questionType: Question['type'], validator: IAnswerValidator): void {
    this.validators.set(questionType, validator);
  }

  /**
   * Removes validator for a question type
   */
  public removeValidator(questionType: Question['type']): boolean {
    return this.validators.delete(questionType);
  }
}

// Singleton factory instance for global use
export const validatorFactory = new ValidatorFactory();