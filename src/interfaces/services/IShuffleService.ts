import type { IQuestion } from '../domain/IQuestion';
import type { IOption } from '../domain/IOption';

/**
 * Interface for shuffling operations on questions and options.
 * Follows Single Responsibility Principle by focusing only on randomization logic.
 * Maintains data integrity while providing randomization capabilities.
 */
export interface IShuffleService {
  /**
   * Shuffles an array of questions randomly
   * @param questions - Array of questions to shuffle
   * @returns New array with shuffled questions (original array unchanged)
   */
  shuffleQuestions(questions: IQuestion[]): IQuestion[];
  
  /**
   * Shuffles the options within a question while maintaining correct answer mapping
   * @param question - Question whose options should be shuffled
   * @returns New question instance with shuffled options and updated correct answer indices
   */
  shuffleQuestionOptions(question: IQuestion): IQuestion;
  
  /**
   * Shuffles an array of options and returns the shuffle mapping
   * @param options - Array of options to shuffle
   * @returns Object containing shuffled options and index mapping from original to new positions
   */
  shuffleOptionsWithMapping(options: IOption[]): {
    shuffledOptions: IOption[];
    indexMapping: number[];
  };
  
  /**
   * Maps original answer indices to new indices after option shuffling
   * @param originalIndices - Original correct answer indices
   * @param indexMapping - Mapping from original positions to new positions
   * @returns New correct answer indices after shuffling
   */
  mapAnswerIndices(originalIndices: number[], indexMapping: number[]): number[];
}
