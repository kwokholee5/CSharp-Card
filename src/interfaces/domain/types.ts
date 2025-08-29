/**
 * Enumeration of question difficulty levels
 */
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Result of answer validation and submission
 */
export interface IAnswerResult {
  /** Whether the submitted answer is correct */
  isCorrect: boolean;
  
  /** Array of indices representing the correct answers */
  correctAnswers: number[];
  
  /** Detailed explanation of the correct answer */
  explanation: string;
  
  /** Array of indices representing the user's selected answers */
  selectedAnswers: number[];
}

/**
 * State information for a specific question
 */
export interface IQuestionState {
  /** Array of indices representing selected answer options */
  selectedAnswers: number[];
  
  /** Whether the question has been submitted */
  isSubmitted: boolean;
  
  /** Whether the submitted answer was correct */
  isCorrect: boolean;
  
  /** Timestamp when the answer was submitted */
  submittedAt?: Date;
}

/**
 * Overall application state
 */
export interface IApplicationState {
  /** Current question index being displayed */
  currentQuestionIndex: number;
  
  /** Map of question IDs to their individual states */
  questionStates: Map<string, IQuestionState>;
  
  /** Whether the application has been properly initialized */
  isInitialized: boolean;
  
  /** Total number of questions available */
  totalQuestions: number;
}