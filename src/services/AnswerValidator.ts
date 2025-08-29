import type { IAnswerValidator } from '../interfaces/validation/IAnswerValidator';
import type { IValidationResult } from '../interfaces/validation/IValidationResult';
import type { IQuestion } from '../interfaces/domain/IQuestion';

/**
 * Validates answer submissions following Single Responsibility Principle.
 * Focuses solely on answer validation logic without side effects.
 */
export class AnswerValidator implements IAnswerValidator {
  
  /**
   * Validates a submitted answer against the correct answer
   * @param question - The question being answered
   * @param selectedAnswers - Array of selected option indices
   * @returns Validation result indicating correctness and any errors
   */
  validate(question: IQuestion, selectedAnswers: number[]): IValidationResult {
    const errors: string[] = [];
    
    // Validate answer indices are within bounds
    const indicesValidation = this.validateAnswerIndices(question, selectedAnswers);
    if (!indicesValidation.isValid) {
      errors.push(...indicesValidation.errors);
    }
    
    // Validate selection count is appropriate
    const countValidation = this.validateSelectionCount(question, selectedAnswers);
    if (!countValidation.isValid) {
      errors.push(...countValidation.errors);
    }
    
    // If there are validation errors, return invalid result
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        metadata: {
          isCorrect: false,
          selectedAnswers,
          correctAnswers: question.getCorrectAnswers()
        }
      };
    }
    
    // Check if the answer is correct
    const isCorrect = this.isCorrectAnswer(question, selectedAnswers);
    
    return {
      isValid: true,
      errors: [],
      metadata: {
        isCorrect,
        selectedAnswers,
        correctAnswers: question.getCorrectAnswers()
      }
    };
  }
  
  /**
   * Validates that the selected answer indices are within valid range
   * @param question - The question being answered
   * @param selectedAnswers - Array of selected option indices
   * @returns Validation result for index bounds
   */
  validateAnswerIndices(question: IQuestion, selectedAnswers: number[]): IValidationResult {
    const errors: string[] = [];
    const maxIndex = question.options.length - 1;
    
    for (const index of selectedAnswers) {
      if (!Number.isInteger(index)) {
        errors.push(`Answer index must be an integer, got: ${index}`);
      } else if (index < 0) {
        errors.push(`Answer index cannot be negative, got: ${index}`);
      } else if (index > maxIndex) {
        errors.push(`Answer index ${index} is out of bounds. Maximum valid index is ${maxIndex}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validates that the number of selected answers is appropriate for the question type
   * @param question - The question being answered
   * @param selectedAnswers - Array of selected option indices
   * @returns Validation result for selection count
   */
  validateSelectionCount(question: IQuestion, selectedAnswers: number[]): IValidationResult {
    const errors: string[] = [];
    const correctAnswers = question.getCorrectAnswers();
    const hasMultipleCorrect = question.hasMultipleCorrectAnswers();
    
    // Check for empty selection
    if (selectedAnswers.length === 0) {
      errors.push('At least one answer must be selected');
      return { isValid: false, errors };
    }
    
    // Check for duplicate selections
    const uniqueAnswers = new Set(selectedAnswers);
    if (uniqueAnswers.size !== selectedAnswers.length) {
      errors.push('Duplicate answer selections are not allowed');
    }
    
    // For single-answer questions, only one selection should be made
    if (!hasMultipleCorrect && selectedAnswers.length > 1) {
      errors.push(`This question expects a single answer, but ${selectedAnswers.length} answers were selected`);
    }
    
    // For multiple-answer questions, validate reasonable selection count
    if (hasMultipleCorrect && selectedAnswers.length > question.options.length) {
      errors.push(`Cannot select more answers than available options (${question.options.length})`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Checks if the submitted answer matches the correct answer(s)
   * @param question - The question being answered
   * @param selectedAnswers - Array of selected option indices
   * @returns True if the answer is correct, false otherwise
   */
  isCorrectAnswer(question: IQuestion, selectedAnswers: number[]): boolean {
    const correctAnswers = question.getCorrectAnswers();
    
    // Sort both arrays for comparison
    const sortedSelected = [...selectedAnswers].sort((a, b) => a - b);
    const sortedCorrect = [...correctAnswers].sort((a, b) => a - b);
    
    // Check if arrays have the same length
    if (sortedSelected.length !== sortedCorrect.length) {
      return false;
    }
    
    // Check if all elements match
    return sortedSelected.every((answer, index) => answer === sortedCorrect[index]);
  }
}