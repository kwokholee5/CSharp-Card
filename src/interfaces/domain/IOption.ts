/**
 * Interface representing a single answer option for a multiple-choice question.
 * Provides immutable access to option content and metadata.
 */
export interface IOption {
  /** Unique identifier for the option */
  readonly id: string;
  
  /** The display text for the option */
  readonly text: string;
  
  /** Optional detailed explanation for this specific option */
  readonly explanation?: string;
}