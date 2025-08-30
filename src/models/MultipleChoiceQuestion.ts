import { IQuestion, ICodeExample, IOption, QuestionDifficulty } from '../interfaces/domain';

/**
 * Concrete implementation of IQuestion for multiple-choice questions.
 * Provides immutable access to question data with proper encapsulation.
 */
export class MultipleChoiceQuestion implements IQuestion {
  private readonly _id: string;
  private readonly _text: string;
  private readonly _options: IOption[];
  private readonly _correctAnswers: number[];
  private readonly _explanation: string;
  private readonly _category: string;
  private readonly _difficulty: QuestionDifficulty;
  private readonly _codeExample?: ICodeExample;

  constructor(
    id: string,
    text: string,
    options: IOption[],
    correctAnswers: number[],
    explanation: string,
    category: string,
    difficulty: QuestionDifficulty,
    codeExample?: ICodeExample
  ) {
    // Validation
    if (!id || id.trim().length === 0) {
      throw new Error('Question ID cannot be empty');
    }
    if (!text || text.trim().length === 0) {
      throw new Error('Question text cannot be empty');
    }
    if (!options || options.length === 0) {
      throw new Error('Question must have at least one option');
    }
    if (!correctAnswers || correctAnswers.length === 0) {
      throw new Error('Question must have at least one correct answer');
    }
    if (!explanation || explanation.trim().length === 0) {
      throw new Error('Question explanation cannot be empty');
    }
    if (!category || category.trim().length === 0) {
      throw new Error('Question category cannot be empty');
    }

    // Validate correct answer indices
    for (const answerIndex of correctAnswers) {
      if (answerIndex < 0 || answerIndex >= options.length) {
        throw new Error(`Correct answer index ${answerIndex} is out of bounds for options array`);
      }
    }

    // Remove duplicates from correct answers
    const uniqueCorrectAnswers = [...new Set(correctAnswers)];

    this._id = id.trim();
    this._text = text.trim();
    this._options = [...options]; // Shallow copy to prevent external mutation
    this._correctAnswers = uniqueCorrectAnswers;
    this._explanation = explanation.trim();
    this._category = category.trim();
    this._difficulty = difficulty;
    this._codeExample = codeExample;
  }

  get id(): string {
    return this._id;
  }

  get text(): string {
    return this._text;
  }

  get options(): IOption[] {
    // Return a new array to prevent external mutation
    return [...this._options];
  }

  get category(): string {
    return this._category;
  }

  get difficulty(): QuestionDifficulty {
    return this._difficulty;
  }

  get explanation(): string {
    return this._explanation;
  }

  get codeExample(): ICodeExample | undefined {
    return this._codeExample;
  }

  /**
   * Returns the indices of correct answer options
   * @returns Array of zero-based indices representing correct answers
   */
  getCorrectAnswers(): number[] {
    // Return a new array to prevent external mutation
    return [...this._correctAnswers];
  }

  /**
   * Determines if the question has multiple correct answers
   * @returns True if multiple answers are correct, false otherwise
   */
  hasMultipleCorrectAnswers(): boolean {
    return this._correctAnswers.length > 1;
  }
}