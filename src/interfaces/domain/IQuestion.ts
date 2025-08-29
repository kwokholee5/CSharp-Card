import { ICodeExample } from './ICodeExample';
import { IOption } from './IOption';
import { QuestionDifficulty } from './types';

/**
 * Core interface for all question types in the application.
 * Represents a single interview question with its associated metadata and content.
 */
export interface IQuestion {
  /** Unique identifier for the question */
  readonly id: string;
  
  /** The main question text */
  readonly text: string;
  
  /** Optional code example associated with the question */
  readonly codeExample?: ICodeExample;
  
  /** Array of answer options for the question */
  readonly options: IOption[];
  
  /** Category classification for the question */
  readonly category: string;
  
  /** Difficulty level of the question */
  readonly difficulty: QuestionDifficulty;
  
  /** Detailed explanation of the correct answer */
  readonly explanation: string;
  
  /**
   * Returns the indices of correct answer options
   * @returns Array of zero-based indices representing correct answers
   */
  getCorrectAnswers(): number[];
  
  /**
   * Determines if the question has multiple correct answers
   * @returns True if multiple answers are correct, false otherwise
   */
  hasMultipleCorrectAnswers(): boolean;
}