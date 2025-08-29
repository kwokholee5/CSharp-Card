// Single Responsibility Principle - handles only progress tracking concerns
// Observer Pattern - allows subscribing to progress changes

import type { Question, UserProgress, StudySession } from '../../utils/types';
import type { ValidationResult, AnswerSubmission } from './IAnswerValidator';

export interface ProgressUpdate {
  questionId: string;
  previousProgress: UserProgress | null;
  newProgress: UserProgress;
  sessionId: string;
  timestamp: Date;
}

export interface StudyMetrics {
  totalQuestions: number;
  correctAnswers: number;
  averageTime: number;
  accuracyRate: number;
  difficultyDistribution: Record<number, number>;
  categoryPerformance: Record<string, { correct: number; total: number }>;
}

// Observer interface for progress changes
export interface IProgressObserver {
  onProgressUpdate(update: ProgressUpdate): void;
  onSessionStart(session: StudySession): void;
  onSessionEnd(session: StudySession, metrics: StudyMetrics): void;
}

// Main progress tracking interface
export interface IProgressTracker {
  /**
   * Updates progress based on answer validation result
   * @param question The question that was answered
   * @param submission The user's submission
   * @param result The validation result
   * @param sessionId Current study session ID
   */
  updateProgress(
    question: Question,
    submission: AnswerSubmission,
    result: ValidationResult,
    sessionId: string
  ): Promise<UserProgress>;

  /**
   * Gets current progress for a specific question
   * @param questionId The question ID to look up
   * @returns Current progress or null if not found
   */
  getProgress(questionId: string): Promise<UserProgress | null>;

  /**
   * Gets progress for multiple questions
   * @param questionIds Array of question IDs
   * @returns Map of question ID to progress
   */
  getBulkProgress(questionIds: string[]): Promise<Map<string, UserProgress>>;

  /**
   * Calculates when a question should next be reviewed (spaced repetition)
   * @param progress Current progress for the question
   * @returns Date for next review
   */
  calculateNextReview(progress: UserProgress): Date;

  /**
   * Gets questions that are due for review
   * @param limit Maximum number of questions to return
   * @returns Questions due for review, sorted by priority
   */
  getDueForReview(limit?: number): Promise<UserProgress[]>;

  /**
   * Starts a new study session
   * @param sessionType Type of study session
   * @param categories Categories to include
   * @returns New session ID
   */
  startSession(
    sessionType: StudySession['sessionType'],
    categories: string[]
  ): Promise<string>;

  /**
   * Ends current study session
   * @param sessionId Session to end
   * @returns Final session metrics
   */
  endSession(sessionId: string): Promise<StudyMetrics>;

  /**
   * Gets current session metrics
   * @param sessionId Session ID to get metrics for
   * @returns Current session metrics
   */
  getSessionMetrics(sessionId: string): Promise<StudyMetrics>;

  /**
   * Subscribes to progress updates
   * @param observer Observer to add
   */
  subscribe(observer: IProgressObserver): void;

  /**
   * Unsubscribes from progress updates
   * @param observer Observer to remove
   */
  unsubscribe(observer: IProgressObserver): void;

  /**
   * Resets progress for a specific question
   * @param questionId Question to reset
   */
  resetProgress(questionId: string): Promise<void>;

  /**
   * Exports all progress data
   * @returns Complete progress data
   */
  exportProgress(): Promise<Record<string, UserProgress>>;

  /**
   * Imports progress data (for backup/restore)
   * @param progressData Progress data to import
   */
  importProgress(progressData: Record<string, UserProgress>): Promise<void>;
}