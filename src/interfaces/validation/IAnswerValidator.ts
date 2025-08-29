import type { IQuestion } from '../domain/IQuestion';
import type { IValidationResult } from './IValidationResult';

/**
 * Interface for validating answer submissions.
 * Follows Interface Segregation Principle by focusing only on answer validation.
 */
export interface IAnswerValidator {
  /**
   * Validates a submitted answer against the correct answer
   * @param question - The question being answered
   * @param selectedAnswers - Array of selected option indices
   * @returns Validation result indicating correctness and any errors
   */
  validate(question: IQuestion, selectedAnswers: number[]): IValidationResult;
  
  /**
   * Validates that the selected answer indices are within valid range
   * @param question - The question being answered
   * @param selectedAnswers - Array of selected option indices
   * @returns Validation result for index bounds
   */
  validateAnswerIndices(question: IQuestion, selectedAnswers: number[]): IValidationResult;
  
  /**
   * Validates that the number of selected answers is appropriate for the question type
   * @param question - The question being answered
   * @param selectedAnswers - Array of selected option indices
   * @returns Validation result for selection count
   */
  validateSelectionCount(question: IQuestion, selectedAnswers: number[]): IValidationResult;
  
  /**
   * Checks if the submitted answer matches the correct answer(s)
   * @param question - The question being answered
   * @param selectedAnswers - Array of selected option indices
   * @returns True if the answer is correct, false otherwise
   */
  isCorrectAnswer(question: IQuestion, selectedAnswers: number[]): boolean;
}