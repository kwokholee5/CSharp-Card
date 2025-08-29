import type { IStateManager } from '../interfaces/services/IStateManager';
import type { IApplicationState, IQuestionState } from '../interfaces/domain/types';

/**
 * StateManager implementation for managing application state.
 * Follows Single Responsibility Principle by focusing only on state management.
 * Ensures state immutability through defensive copying.
 */
export class StateManager implements IStateManager {
  private state: IApplicationState;

  constructor() {
    this.state = this.createInitialState();
  }

  /**
   * Creates the initial application state
   * @returns Initial application state with default values
   */
  private createInitialState(): IApplicationState {
    return {
      currentQuestionIndex: 0,
      questionStates: new Map<string, IQuestionState>(),
      isInitialized: false,
      totalQuestions: 0
    };
  }

  /**
   * Gets the current application state with defensive copying
   * @returns Complete application state object (immutable copy)
   */
  getApplicationState(): IApplicationState {
    return {
      currentQuestionIndex: this.state.currentQuestionIndex,
      questionStates: new Map(this.state.questionStates),
      isInitialized: this.state.isInitialized,
      totalQuestions: this.state.totalQuestions
    };
  }

  /**
   * Updates the state for a specific question with immutability
   * @param questionId - Unique identifier of the question
   * @param state - New question state to apply
   */
  updateQuestionState(questionId: string, state: IQuestionState): void {
    if (!questionId) {
      throw new Error('Question ID cannot be empty');
    }

    // Create immutable copy of the question state
    const immutableState: IQuestionState = {
      selectedAnswers: [...state.selectedAnswers],
      isSubmitted: state.isSubmitted,
      isCorrect: state.isCorrect,
      submittedAt: state.submittedAt ? new Date(state.submittedAt) : undefined
    };

    // Update the state map with new entry
    this.state.questionStates.set(questionId, immutableState);
  }

  /**
   * Gets the state for a specific question with defensive copying
   * @param questionId - Unique identifier of the question
   * @returns Question state or null if no state exists (immutable copy)
   */
  getQuestionState(questionId: string): IQuestionState | null {
    if (!questionId) {
      return null;
    }

    const state = this.state.questionStates.get(questionId);
    if (!state) {
      return null;
    }

    // Return immutable copy
    return {
      selectedAnswers: [...state.selectedAnswers],
      isSubmitted: state.isSubmitted,
      isCorrect: state.isCorrect,
      submittedAt: state.submittedAt ? new Date(state.submittedAt) : undefined
    };
  }

  /**
   * Resets the entire application state to initial values
   */
  resetApplicationState(): void {
    this.state = this.createInitialState();
  }

  /**
   * Updates the current question index with validation
   * @param index - New question index to set
   */
  setCurrentQuestionIndex(index: number): void {
    if (index < 0) {
      throw new Error('Question index cannot be negative');
    }

    if (this.state.totalQuestions > 0 && index >= this.state.totalQuestions) {
      throw new Error(`Question index ${index} exceeds total questions ${this.state.totalQuestions}`);
    }

    this.state.currentQuestionIndex = index;
  }

  /**
   * Gets the current question index
   * @returns Current question index
   */
  getCurrentQuestionIndex(): number {
    return this.state.currentQuestionIndex;
  }

  /**
   * Sets the total number of questions with validation
   * @param total - Total number of questions available
   */
  setTotalQuestions(total: number): void {
    if (total < 0) {
      throw new Error('Total questions cannot be negative');
    }

    this.state.totalQuestions = total;

    // Adjust current index if it exceeds new total
    if (this.state.currentQuestionIndex >= total && total > 0) {
      this.state.currentQuestionIndex = total - 1;
    } else if (total === 0) {
      this.state.currentQuestionIndex = 0;
    }
  }

  /**
   * Marks the application as initialized
   * @param initialized - Whether the application is initialized
   */
  setInitialized(initialized: boolean): void {
    this.state.isInitialized = initialized;
  }

  /**
   * Checks if the application is initialized
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean {
    return this.state.isInitialized;
  }
}