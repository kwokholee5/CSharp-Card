import { IQuestion } from '../domain/IQuestion';

/**
 * Repository interface for question data access operations.
 * Provides abstraction over the data source following the Repository pattern.
 * Implements Dependency Inversion Principle by defining contracts for data access.
 */
export interface IQuestionRepository {
  /**
   * Loads all questions from the data source
   * @returns Promise resolving to array of all questions
   * @throws DataLoadError if questions cannot be loaded
   */
  loadQuestions(): Promise<IQuestion[]>;
  
  /**
   * Retrieves a specific question by its unique identifier
   * @param id - The unique question identifier
   * @returns Promise resolving to the question or null if not found
   * @throws DataLoadError if data access fails
   */
  getQuestionById(id: string): Promise<IQuestion | null>;
  
  /**
   * Retrieves all questions belonging to a specific category
   * @param category - The category to filter by
   * @returns Promise resolving to array of questions in the category
   * @throws DataLoadError if data access fails
   */
  getQuestionsByCategory(category: string): Promise<IQuestion[]>;
  
  /**
   * Gets the total count of available questions
   * @returns Promise resolving to the total number of questions
   * @throws DataLoadError if data access fails
   */
  getTotalCount(): Promise<number>;
}