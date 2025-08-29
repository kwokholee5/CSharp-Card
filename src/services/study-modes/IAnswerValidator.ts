// Interface Segregation Principle - separate validation concerns
// Strategy Pattern - different validation strategies for different question types

import type { Question, UserProgress } from '../../utils/types';

export interface ValidationResult {
  isCorrect: boolean;
  score: number; // 0-1 scale
  feedback?: string;
  explanation?: string;
  timePenalty?: number; // For time-based scoring
}

export interface AnswerSubmission {
  questionId: string;
  timestamp: Date;
  timeSpent: number; // in milliseconds
  userAnswer: unknown; // Can be string, number, boolean[], etc.
}

// Main validation interface - Strategy pattern
export interface IAnswerValidator {
  /**
   * Validates a user's answer against the correct answer
   * @param question The question being answered
   * @param submission The user's answer submission
   * @returns ValidationResult with score and feedback
   */
  validateAnswer(question: Question, submission: AnswerSubmission): ValidationResult;

  /**
   * Gets the maximum possible score for this question type
   * @param question The question to score
   * @returns Maximum score value
   */
  getMaxScore(question: Question): number;

  /**
   * Determines if this validator can handle the given question type
   * @param question The question to validate
   * @returns True if this validator can handle the question
   */
  canValidate(question: Question): boolean;
}

// Specialized interface for validators that need access to user progress
export interface IProgressAwareValidator extends IAnswerValidator {
  /**
   * Validates answer with consideration of user's learning progress
   * @param question The question being answered
   * @param submission The user's answer submission
   * @param progress The user's progress on this question
   * @returns ValidationResult adjusted for progress
   */
  validateWithProgress(
    question: Question, 
    submission: AnswerSubmission, 
    progress?: UserProgress
  ): ValidationResult;
}

// Factory interface for creating validators
export interface IValidatorFactory {
  /**
   * Creates appropriate validator for the given question type
   * @param questionType The type of question to validate
   * @returns Validator instance or null if unsupported
   */
  createValidator(questionType: Question['type']): IAnswerValidator | null;

  /**
   * Gets all supported question types
   * @returns Array of supported question type strings
   */
  getSupportedTypes(): Question['type'][];
}