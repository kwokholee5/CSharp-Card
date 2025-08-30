import type { IApplicationState, IQuestionState } from '../domain/types';

/**
 * Interface for managing application state.
 * Follows Single Responsibility Principle by focusing only on state management.
 */
export interface IStateManager {
  /**
   * Gets the current application state
   * @returns Complete application state object
   */
  getApplicationState(): IApplicationState;
  
  /**
   * Updates the state for a specific question
   * @param questionId - Unique identifier of the question
   * @param state - New question state to apply
   */
  updateQuestionState(questionId: string, state: IQuestionState): void;
  
  /**
   * Gets the state for a specific question
   * @param questionId - Unique identifier of the question
   * @returns Question state or null if no state exists
   */
  getQuestionState(questionId: string): IQuestionState | null;
  
  /**
   * Resets the entire application state to initial values
   */
  resetApplicationState(): void;
  
  /**
   * Updates the current question index
   * @param index - New question index to set
   */
  setCurrentQuestionIndex(index: number): void;
  
  /**
   * Gets the current question index
   * @returns Current question index
   */
  getCurrentQuestionIndex(): number;
  
  /**
   * Sets the total number of questions
   * @param total - Total number of questions available
   */
  setTotalQuestions(total: number): void;
  
  /**
   * Marks the application as initialized
   * @param initialized - Whether the application is initialized
   */
  setInitialized(initialized: boolean): void;
  
  /**
   * Checks if the application is initialized
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean;
}