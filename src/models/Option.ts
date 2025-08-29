import { IOption } from '../interfaces/domain';

/**
 * Concrete implementation of IOption representing a single answer choice.
 * Provides immutable access to option content with proper validation and encapsulation.
 */
export class Option implements IOption {
  private readonly _id: string;
  private readonly _text: string;
  private readonly _explanation?: string;

  constructor(id: string, text: string, explanation?: string) {
    // Validation
    if (!id || id.trim().length === 0) {
      throw new Error('Option ID cannot be empty');
    }
    if (!text || text.trim().length === 0) {
      throw new Error('Option text cannot be empty');
    }

    this._id = id.trim();
    this._text = text.trim();
    this._explanation = explanation?.trim() || undefined;
  }

  get id(): string {
    return this._id;
  }

  get text(): string {
    return this._text;
  }

  get explanation(): string | undefined {
    return this._explanation;
  }

  /**
   * Checks if the option has an explanation
   * @returns True if explanation is available, false otherwise
   */
  hasExplanation(): boolean {
    return this._explanation !== undefined && this._explanation.length > 0;
  }

  /**
   * Creates a string representation of the option
   * @returns Formatted string representation
   */
  toString(): string {
    let result = `${this._id}: ${this._text}`;
    if (this._explanation) {
      result += ` (${this._explanation})`;
    }
    return result;
  }

  /**
   * Compares this option with another option for equality
   * @param other The other option to compare with
   * @returns True if options are equal, false otherwise
   */
  equals(other: IOption): boolean {
    return this._id === other.id && 
           this._text === other.text && 
           this._explanation === other.explanation;
  }
}