import type { IQuestion } from '../domain/IQuestion';

/**
 * Interface for managing question navigation and retrieval.
 * Follows Single Responsibility Principle by focusing only on question management.
 */
export interface IQuestionManager {
  /**
   * Gets the currently active question
   * @returns The current question or null if no question is available
   */
  getCurrentQuestion(): IQuestion | null;
  
  /**
   * Moves to the next question in the sequence
   * @returns True if successfully moved to next question, false if at end
   */
  moveToNext(): boolean;
  
  /**
   * Moves to the previous question in the sequence
   * @returns True if successfully moved to previous question, false if at beginning
   */
  moveToPrevious(): boolean;
  
  /**
   * Resets the current question to its initial state
   * This method focuses only on question state, not answer state
   */
  resetCurrent(): void;
  
  /**
   * Gets the total number of questions available
   * @returns Total count of questions
   */
  getTotalCount(): number;
  
  /**
   * Gets the current question index (zero-based)
   * @returns Current question index
   */
  getCurrentIndex(): number;
  
  /**
   * Initializes the question manager with question data
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;
}