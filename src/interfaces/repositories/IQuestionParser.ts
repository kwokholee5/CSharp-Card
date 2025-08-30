import { IQuestion } from '../domain/IQuestion';
import { RawQuestionData } from './IQuestionLoader';

/**
 * Validation result for question parsing operations.
 * Provides detailed feedback about parsing success or failure.
 */
export interface IParseValidationResult {
  /** Whether the parsing was successful */
  isValid: boolean;
  
  /** Array of validation error messages */
  errors: string[];
  
  /** Array of warning messages for non-critical issues */
  warnings: string[];
}

/**
 * Interface for transforming raw JSON data into domain model objects.
 * Handles the conversion from external data format to internal domain models.
 * Follows Single Responsibility Principle by focusing only on data transformation.
 */
export interface IQuestionParser {
  /**
   * Parses an array of raw question data into domain model questions
   * @param rawData - Array of raw question data from JSON
   * @returns Promise resolving to array of parsed question domain models
   * @throws ValidationError if any question data is invalid
   */
  parseQuestions(rawData: RawQuestionData[]): Promise<IQuestion[]>;
  
  /**
   * Parses a single raw question data object into a domain model
   * @param rawQuestion - Raw question data from JSON
   * @returns Promise resolving to parsed question domain model
   * @throws ValidationError if question data is invalid
   */
  parseQuestion(rawQuestion: RawQuestionData): Promise<IQuestion>;
  
  /**
   * Validates raw question data without parsing
   * @param rawQuestion - Raw question data to validate
   * @returns Validation result with success status and any errors/warnings
   */
  validateQuestionData(rawQuestion: RawQuestionData): IParseValidationResult;
  
  /**
   * Validates an array of raw question data
   * @param rawData - Array of raw question data to validate
   * @returns Validation result with success status and any errors/warnings
   */
  validateQuestionsData(rawData: RawQuestionData[]): IParseValidationResult;
}