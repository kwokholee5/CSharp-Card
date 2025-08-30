import type { IAnswerManager } from '../interfaces/services/IAnswerManager';
import type { IAnswerValidator } from '../interfaces/validation/IAnswerValidator';
import type { IStateManager } from '../interfaces/services/IStateManager';
import type { IQuestionManager } from '../interfaces/services/IQuestionManager';
import type { IAnswerResult, IQuestionState } from '../interfaces/domain/types';

/**
 * Manages answer submission and validation following Single Responsibility Principle.
 * Coordinates between validation, state management, and question retrieval.
 */
export class AnswerManager implements IAnswerManager {
  
  constructor(
    private readonly validator: IAnswerValidator,
    private readonly stateManager: IStateManager,
    private readonly questionManager: IQuestionManager
  ) {}
  
  /**
   * Submits an answer for a specific question
   * @param questionId - Unique identifier of the question
   * @param selectedOptions - Array of selected option indices
   * @returns Result containing correctness, explanation, and answer details
   */
  submitAnswer(questionId: string, selectedOptions: number[]): IAnswerResult {
    // Get the current question from question manager
    const question = this.questionManager.getCurrentQuestion();
    if (!question) {
      throw new Error('No current question available');
    }
    
    // Verify the question ID matches (additional safety check)
    if (question.id !== questionId) {
      throw new Error(`Question ID mismatch. Expected: ${questionId}, Current: ${question.id}`);
    }
    
    // Validate the submitted answer
    const validationResult = this.validator.validate(question, selectedOptions);
    
    // If validation failed, throw an error with details
    if (!validationResult.isValid) {
      throw new Error(`Answer validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    // Extract correctness from validation metadata
    const isCorrect = validationResult.metadata?.isCorrect ?? false;
    
    // Create answer result
    const answerResult: IAnswerResult = {
      isCorrect,
      correctAnswers: question.getCorrectAnswers(),
      explanation: question.explanation,
      selectedAnswers: [...selectedOptions] // Create defensive copy
    };
    
    // Update question state
    const questionState: IQuestionState = {
      selectedAnswers: [...selectedOptions], // Create defensive copy
      isSubmitted: true,
      isCorrect,
      submittedAt: new Date()
    };
    
    this.stateManager.updateQuestionState(questionId, questionState);
    
    return answerResult;
  }
  
  /**
   * Gets the current answer state for a specific question
   * @param questionId - Unique identifier of the question
   * @returns Current answer state or null if no state exists
   */
  getAnswerState(questionId: string): IQuestionState | null {
    return this.stateManager.getQuestionState(questionId);
  }
  
  /**
   * Resets the answer state for a specific question
   * @param questionId - Unique identifier of the question
   */
  resetAnswer(questionId: string): void {
    const resetState: IQuestionState = {
      selectedAnswers: [],
      isSubmitted: false,
      isCorrect: false,
      submittedAt: undefined
    };
    
    this.stateManager.updateQuestionState(questionId, resetState);
  }
  
  /**
   * Checks if a question has been answered
   * @param questionId - Unique identifier of the question
   * @returns True if the question has been answered, false otherwise
   */
  isAnswered(questionId: string): boolean {
    const state = this.getAnswerState(questionId);
    return state?.isSubmitted ?? false;
  }
  
  /**
   * Gets the selected options for a specific question
   * @param questionId - Unique identifier of the question
   * @returns Array of selected option indices, empty array if no selection
   */
  getSelectedOptions(questionId: string): number[] {
    const state = this.getAnswerState(questionId);
    return state?.selectedAnswers ? [...state.selectedAnswers] : [];
  }
  

}