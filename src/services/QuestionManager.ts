import type { IQuestion } from '../interfaces/domain/IQuestion';
import type { IQuestionManager } from '../interfaces/services/IQuestionManager';
import type { IQuestionRepository } from '../interfaces/repositories/IQuestionRepository';
import type { IStateManager } from '../interfaces/services/IStateManager';

/**
 * Manages question navigation and retrieval operations.
 * Follows Single Responsibility Principle by focusing only on question management.
 * Implements proper error handling for invalid navigation scenarios.
 */
export class QuestionManager implements IQuestionManager {
  private questions: IQuestion[] = [];
  private isInitializedFlag: boolean = false;

  constructor(
    private readonly questionRepository: IQuestionRepository,
    private readonly stateManager: IStateManager
  ) {}

  /**
   * Initializes the question manager by loading questions from the repository
   * @throws Error if questions cannot be loaded or if already initialized
   */
  async initialize(): Promise<void> {
    if (this.isInitializedFlag) {
      throw new Error('QuestionManager is already initialized');
    }

    try {
      this.questions = await this.questionRepository.loadQuestions();
      
      if (this.questions.length === 0) {
        throw new Error('No questions available to load');
      }

      this.stateManager.setTotalQuestions(this.questions.length);
      this.stateManager.setInitialized(true);
      this.isInitializedFlag = true;
    } catch (error) {
      throw new Error(`Failed to initialize QuestionManager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets the currently active question
   * @returns The current question or null if no question is available
   */
  getCurrentQuestion(): IQuestion | null {
    if (!this.isInitializedFlag || this.questions.length === 0) {
      return null;
    }

    const currentIndex = this.stateManager.getCurrentQuestionIndex();
    
    if (currentIndex < 0 || currentIndex >= this.questions.length) {
      return null;
    }

    return this.questions[currentIndex];
  }

  /**
   * Moves to the next question in the sequence
   * @returns True if successfully moved to next question, false if at end
   * @throws Error if not initialized
   */
  moveToNext(): boolean {
    this.ensureInitialized();

    const currentIndex = this.stateManager.getCurrentQuestionIndex();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= this.questions.length) {
      return false;
    }

    this.stateManager.setCurrentQuestionIndex(nextIndex);
    return true;
  }

  /**
   * Moves to the previous question in the sequence
   * @returns True if successfully moved to previous question, false if at beginning
   * @throws Error if not initialized
   */
  moveToPrevious(): boolean {
    this.ensureInitialized();

    const currentIndex = this.stateManager.getCurrentQuestionIndex();
    const previousIndex = currentIndex - 1;

    if (previousIndex < 0) {
      return false;
    }

    this.stateManager.setCurrentQuestionIndex(previousIndex);
    return true;
  }

  /**
   * Resets the current question to its initial state
   * This method focuses only on question navigation state, not answer state
   * @throws Error if not initialized or no current question
   */
  resetCurrent(): void {
    this.ensureInitialized();

    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      throw new Error('No current question to reset');
    }

    // Reset only navigation-related state, not answer state
    // The question remains at the same index but any navigation-specific state is cleared
    // Answer state management is handled by AnswerManager following SRP
  }

  /**
   * Gets the total number of questions available
   * @returns Total count of questions
   */
  getTotalCount(): number {
    return this.questions.length;
  }

  /**
   * Gets the current question index (zero-based)
   * @returns Current question index
   */
  getCurrentIndex(): number {
    if (!this.isInitializedFlag) {
      return -1;
    }
    return this.stateManager.getCurrentQuestionIndex();
  }

  /**
   * Ensures the QuestionManager is properly initialized
   * @throws Error if not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitializedFlag) {
      throw new Error('QuestionManager must be initialized before use');
    }
  }
}