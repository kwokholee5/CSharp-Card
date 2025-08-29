import type { IAnswerResult, IQuestionState } from '../domain/types';

/**
 * Interface for managing answer submission and validation.
 * Follows Single Responsibility Principle by focusing only on answer handling.
 */
export interface IAnswerManager {
  /**
   * Submits an answer for a specific question
   * @param questionId - Unique identifier of the question
   * @param selectedOptions - Array of selected option indices
   * @returns Result containing correctness, explanation, and answer details
   */
  submitAnswer(questionId: string, selectedOptions: number[]): IAnswerResult;
  
  /**
   * Gets the current answer state for a specific question
   * @param questionId - Unique identifier of the question
   * @returns Current answer state or null if no state exists
   */
  getAnswerState(questionId: string): IQuestionState | null;
  
  /**
   * Resets the answer state for a specific question
   * @param questionId - Unique identifier of the question
   */
  resetAnswer(questionId: string): void;
  
  /**
   * Checks if a question has been answered
   * @param questionId - Unique identifier of the question
   * @returns True if the question has been answered, false otherwise
   */
  isAnswered(questionId: string): boolean;
  
  /**
   * Gets the selected options for a specific question
   * @param questionId - Unique identifier of the question
   * @returns Array of selected option indices, empty array if no selection
   */
  getSelectedOptions(questionId: string): number[];
}