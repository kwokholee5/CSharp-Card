import { IQuestionParser, IParseValidationResult } from '../interfaces/repositories/IQuestionParser';
import { RawQuestionData } from '../interfaces/repositories/IQuestionLoader';
import { IQuestion } from '../interfaces/domain/IQuestion';
import { MultipleChoiceQuestion } from '../models/MultipleChoiceQuestion';
import { CodeExample } from '../models/CodeExample';
import { Option } from '../models/Option';
import { QuestionDifficulty } from '../interfaces/domain/types';
import { ValidationError } from '../models/errors/ValidationError';

/**
 * Concrete implementation of IQuestionParser for transforming raw JSON data into domain models.
 * Handles validation and conversion from external data format to internal domain objects.
 * Follows Single Responsibility Principle by focusing only on data transformation.
 */
export class QuestionParser implements IQuestionParser {
  
  /**
   * Parses an array of raw question data into domain model questions
   * @param rawData - Array of raw question data from JSON
   * @returns Promise resolving to array of parsed question domain models
   * @throws ValidationError if any question data is invalid
   */
  async parseQuestions(rawData: RawQuestionData[]): Promise<IQuestion[]> {
    const validationResult = this.validateQuestionsData(rawData);
    
    if (!validationResult.isValid) {
      throw new ValidationError(
        'Invalid question data provided',
        validationResult.errors
      );
    }
    
    const questions: IQuestion[] = [];
    
    for (const rawQuestion of rawData) {
      try {
        const question = await this.parseQuestion(rawQuestion);
        questions.push(question);
      } catch (error) {
        throw new ValidationError(
          `Failed to parse question ${rawQuestion.id}`,
          [error instanceof Error ? error.message : 'Unknown parsing error']
        );
      }
    }
    
    return questions;
  }
  
  /**
   * Parses a single raw question data object into a domain model
   * @param rawQuestion - Raw question data from JSON
   * @returns Promise resolving to parsed question domain model
   * @throws ValidationError if question data is invalid
   */
  async parseQuestion(rawQuestion: RawQuestionData): Promise<IQuestion> {
    const validationResult = this.validateQuestionData(rawQuestion);
    
    if (!validationResult.isValid) {
      throw new ValidationError(
        `Invalid question data for ${rawQuestion.id}`,
        validationResult.errors
      );
    }
    
    // Parse options
    const options = (rawQuestion.options || []).map((optionData, index) => 
      new Option(
        optionData.id || index.toString(),
        optionData.text,
        optionData.explanation
      )
    );
    
    // Parse code example if present
    let codeExample: CodeExample | undefined;
    if (rawQuestion.codeExample) {
      codeExample = new CodeExample(
        rawQuestion.codeExample.code,
        rawQuestion.codeExample.language,
        rawQuestion.codeExample.output
      );
    }
    
    // Determine correct answers
    const correctAnswers = this.parseCorrectAnswers(rawQuestion);
    
    // Map difficulty number to enum
    const difficulty = this.mapDifficulty(rawQuestion.difficulty);
    
    return new MultipleChoiceQuestion(
      rawQuestion.id,
      rawQuestion.question,
      options,
      correctAnswers,
      rawQuestion.explanation,
      rawQuestion.category,
      difficulty,
      codeExample
    );
  }
  
  /**
   * Validates raw question data without parsing
   * @param rawQuestion - Raw question data to validate
   * @returns Validation result with success status and any errors/warnings
   */
  validateQuestionData(rawQuestion: RawQuestionData): IParseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields validation
    if (!rawQuestion.id || typeof rawQuestion.id !== 'string') {
      errors.push('Question ID is required and must be a string');
    }
    
    if (!rawQuestion.question || typeof rawQuestion.question !== 'string') {
      errors.push('Question text is required and must be a string');
    }
    
    if (!rawQuestion.explanation || typeof rawQuestion.explanation !== 'string') {
      errors.push('Question explanation is required and must be a string');
    }
    
    if (!rawQuestion.category || typeof rawQuestion.category !== 'string') {
      errors.push('Question category is required and must be a string');
    }
    
    // Options validation
    if (!Array.isArray(rawQuestion.options) || rawQuestion.options.length === 0) {
      errors.push('Question must have at least one option');
    } else {
      rawQuestion.options.forEach((option, index) => {
        if (!option.text || typeof option.text !== 'string') {
          errors.push(`Option ${index} must have text`);
        }
      });
    }
    
    // Correct answer validation
    const hasCorrectAnswerIndex = typeof rawQuestion.correctAnswerIndex === 'number';
    const hasCorrectAnswerIndices = Array.isArray(rawQuestion.correctAnswerIndices);
    
    if (!hasCorrectAnswerIndex && !hasCorrectAnswerIndices) {
      errors.push('Question must specify correct answer(s) using correctAnswerIndex or correctAnswerIndices');
    }
    
    if (hasCorrectAnswerIndex && hasCorrectAnswerIndices) {
      warnings.push('Question has both correctAnswerIndex and correctAnswerIndices; correctAnswerIndices will be used');
    }
    
    // Validate correct answer indices are within bounds
    if (hasCorrectAnswerIndices && rawQuestion.options) {
      const invalidIndices = rawQuestion.correctAnswerIndices!.filter(
        index => index < 0 || index >= (rawQuestion.options?.length || 0)
      );
      if (invalidIndices.length > 0) {
        errors.push(`Correct answer indices out of bounds: ${invalidIndices.join(', ')}`);
      }
    }
    
    if (hasCorrectAnswerIndex && rawQuestion.options) {
      if (rawQuestion.correctAnswerIndex! < 0 || rawQuestion.correctAnswerIndex! >= rawQuestion.options.length) {
        errors.push(`Correct answer index out of bounds: ${rawQuestion.correctAnswerIndex}`);
      }
    }
    
    // Difficulty validation
    if (typeof rawQuestion.difficulty !== 'number' || rawQuestion.difficulty < 1 || rawQuestion.difficulty > 10) {
      errors.push('Difficulty must be a number between 1 and 10');
    }
    
    // Code example validation (if present)
    if (rawQuestion.codeExample) {
      if (!rawQuestion.codeExample.code || typeof rawQuestion.codeExample.code !== 'string') {
        errors.push('Code example must have code text');
      }
      if (!rawQuestion.codeExample.language || typeof rawQuestion.codeExample.language !== 'string') {
        errors.push('Code example must specify language');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validates an array of raw question data
   * @param rawData - Array of raw question data to validate
   * @returns Validation result with success status and any errors/warnings
   */
  validateQuestionsData(rawData: RawQuestionData[]): IParseValidationResult {
    if (!Array.isArray(rawData)) {
      return {
        isValid: false,
        errors: ['Question data must be an array'],
        warnings: []
      };
    }
    
    if (rawData.length === 0) {
      return {
        isValid: false,
        errors: ['Question data array cannot be empty'],
        warnings: []
      };
    }
    
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const seenIds = new Set<string>();
    
    rawData.forEach((question, index) => {
      const result = this.validateQuestionData(question);
      
      // Add context to errors
      result.errors.forEach(error => {
        allErrors.push(`Question ${index} (${question.id || 'unknown'}): ${error}`);
      });
      
      result.warnings.forEach(warning => {
        allWarnings.push(`Question ${index} (${question.id || 'unknown'}): ${warning}`);
      });
      
      // Check for duplicate IDs
      if (question.id) {
        if (seenIds.has(question.id)) {
          allErrors.push(`Duplicate question ID: ${question.id}`);
        } else {
          seenIds.add(question.id);
        }
      }
    });
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
  
  /**
   * Parses correct answers from raw question data
   * @param rawQuestion - Raw question data
   * @returns Array of correct answer indices
   */
  private parseCorrectAnswers(rawQuestion: RawQuestionData): number[] {
    if (Array.isArray(rawQuestion.correctAnswerIndices)) {
      return [...rawQuestion.correctAnswerIndices];
    }
    
    if (typeof rawQuestion.correctAnswerIndex === 'number') {
      return [rawQuestion.correctAnswerIndex];
    }
    
    throw new Error('No valid correct answer specification found');
  }
  
  /**
   * Maps numeric difficulty to QuestionDifficulty enum
   * @param difficulty - Numeric difficulty (1-10)
   * @returns QuestionDifficulty enum value
   */
  private mapDifficulty(difficulty: number): QuestionDifficulty {
    switch (difficulty) {
      case 1:
      case 2:
      case 3:
        return 'easy';
      case 4:
      case 5:
      case 6:
        return 'medium';
      case 7:
      case 8:
      case 9:
      case 10:
        return 'hard';
      default:
        return 'medium'; // Default fallback
    }
  }
}