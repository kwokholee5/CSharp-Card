import type { IQuestion } from '../domain/IQuestion';
import type { IValidationResult } from './IValidationResult';

/**
 * Interface for validating question data integrity.
 * Follows Interface Segregation Principle by focusing only on question validation.
 */
export interface IQuestionValidator {
  /**
   * Validates a complete question object for data integrity
   * @param question - The question to validate
   * @returns Validation result indicating any structural or data issues
   */
  validateQuestion(question: IQuestion): IValidationResult;
  
  /**
   * Validates that the question has required fields populated
   * @param question - The question to validate
   * @returns Validation result for required fields
   */
  validateRequiredFields(question: IQuestion): IValidationResult;
  
  /**
   * Validates that the question options are properly structured
   * @param question - The question to validate
   * @returns Validation result for option structure
   */
  validateOptions(question: IQuestion): IValidationResult;
  
  /**
   * Validates that the correct answer indices are valid
   * @param question - The question to validate
   * @returns Validation result for correct answer indices
   */
  validateCorrectAnswers(question: IQuestion): IValidationResult;
  
  /**
   * Validates that the question text is not empty and meets minimum requirements
   * @param question - The question to validate
   * @returns Validation result for question text
   */
  validateQuestionText(question: IQuestion): IValidationResult;
  
  /**
   * Validates code example structure if present
   * @param question - The question to validate
   * @returns Validation result for code example
   */
  validateCodeExample(question: IQuestion): IValidationResult;
}