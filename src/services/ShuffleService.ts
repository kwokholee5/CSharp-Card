import type { IShuffleService } from '../interfaces/services/IShuffleService';
import type { IQuestion } from '../interfaces/domain/IQuestion';
import type { IOption } from '../interfaces/domain/IOption';
import { MultipleChoiceQuestion } from '../models/MultipleChoiceQuestion';

/**
 * Implementation of IShuffleService providing randomization capabilities.
 * Uses Fisher-Yates shuffle algorithm for unbiased randomization.
 * Maintains data integrity and answer correctness during shuffling operations.
 */
export class ShuffleService implements IShuffleService {

  /**
   * Shuffles an array of questions randomly using Fisher-Yates algorithm
   * @param questions - Array of questions to shuffle
   * @returns New array with shuffled questions (original array unchanged)
   */
  shuffleQuestions(questions: IQuestion[]): IQuestion[] {
    if (!questions || questions.length === 0) {
      return [];
    }

    // Create a copy to avoid mutating the original array
    const shuffled = [...questions];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Shuffles the options within a question while maintaining correct answer mapping
   * @param question - Question whose options should be shuffled
   * @returns New question instance with shuffled options and updated correct answer indices
   */
  shuffleQuestionOptions(question: IQuestion): IQuestion {
    if (!question || !question.options || question.options.length === 0) {
      return question;
    }

    const correctAnswers = question.getCorrectAnswers();
    
    // Don't shuffle if there are no correct answers to preserve
    if (!correctAnswers || correctAnswers.length === 0) {
      return question;
    }

    const shuffleResult = this.shuffleOptionsWithMapping(question.options);
    const newCorrectAnswers = this.mapAnswerIndices(
      correctAnswers, 
      shuffleResult.indexMapping
    );

    // Create new question instance with shuffled options
    return new MultipleChoiceQuestion(
      question.id,
      question.text,
      shuffleResult.shuffledOptions,
      newCorrectAnswers,
      question.explanation,
      question.category,
      question.difficulty,
      question.codeExample
    );
  }

  /**
   * Shuffles an array of options and returns the shuffle mapping
   * @param options - Array of options to shuffle
   * @returns Object containing shuffled options and index mapping from original to new positions
   */
  shuffleOptionsWithMapping(options: IOption[]): {
    shuffledOptions: IOption[];
    indexMapping: number[];
  } {
    if (!options || options.length === 0) {
      return {
        shuffledOptions: [],
        indexMapping: []
      };
    }

    // Create array of indices to track original positions
    const indices = Array.from({ length: options.length }, (_, i) => i);
    const shuffledOptions: IOption[] = [];
    const indexMapping: number[] = new Array(options.length);

    // Fisher-Yates shuffle on indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Build shuffled array and create mapping
    for (let newIndex = 0; newIndex < indices.length; newIndex++) {
      const originalIndex = indices[newIndex];
      shuffledOptions[newIndex] = options[originalIndex];
      
      // indexMapping[originalIndex] = newIndex (where original item ended up)
      indexMapping[originalIndex] = newIndex;
    }

    return {
      shuffledOptions,
      indexMapping
    };
  }

  /**
   * Maps original answer indices to new indices after option shuffling
   * @param originalIndices - Original correct answer indices
   * @param indexMapping - Mapping from original positions to new positions
   * @returns New correct answer indices after shuffling
   */
  mapAnswerIndices(originalIndices: number[], indexMapping: number[]): number[] {
    if (!originalIndices || originalIndices.length === 0) {
      return [];
    }

    return originalIndices
      .map(originalIndex => {
        if (originalIndex >= 0 && originalIndex < indexMapping.length) {
          return indexMapping[originalIndex];
        }
        throw new Error(`Invalid answer index ${originalIndex} for options array of length ${indexMapping.length}`);
      })
      .sort(); // Keep indices sorted for consistency
  }
}
