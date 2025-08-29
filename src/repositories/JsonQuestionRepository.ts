import { IQuestionRepository } from '../interfaces/repositories/IQuestionRepository';
import { IQuestionLoader } from '../interfaces/repositories/IQuestionLoader';
import { IQuestionParser } from '../interfaces/repositories/IQuestionParser';
import { IQuestion } from '../interfaces/domain/IQuestion';
import { DataLoadError } from '../models/errors/DataLoadError';

/**
 * Concrete implementation of IQuestionRepository that loads questions from JSON files.
 * Implements the Repository pattern with Dependency Inversion Principle.
 * Depends on abstractions (IQuestionLoader, IQuestionParser) rather than concrete implementations.
 */
export class JsonQuestionRepository implements IQuestionRepository {
  private questions: IQuestion[] = [];
  private isLoaded = false;
  
  /**
   * Creates a new JsonQuestionRepository instance
   * @param questionLoader - Service for loading raw question data from files
   * @param questionParser - Service for parsing raw data into domain models
   * @param questionPaths - Array of file paths or directory path to load questions from
   */
  constructor(
    private readonly questionLoader: IQuestionLoader,
    private readonly questionParser: IQuestionParser,
    private readonly questionPaths: string[]
  ) {}
  
  /**
   * Loads all questions from the configured data sources
   * @returns Promise resolving to array of all questions
   * @throws DataLoadError if questions cannot be loaded
   */
  async loadQuestions(): Promise<IQuestion[]> {
    if (this.isLoaded) {
      return [...this.questions];
    }
    
    try {
      // Load raw data from all configured paths
      const rawQuestions = await this.questionLoader.loadFromMultipleJson(this.questionPaths);
      
      // Parse raw data into domain models
      this.questions = await this.questionParser.parseQuestions(rawQuestions);
      
      this.isLoaded = true;
      
      return [...this.questions];
    } catch (error) {
      throw new DataLoadError(
        `question paths: ${this.questionPaths.join(', ')}`,
        error as Error
      );
    }
  }
  
  /**
   * Retrieves a specific question by its unique identifier
   * @param id - The unique question identifier
   * @returns Promise resolving to the question or null if not found
   * @throws DataLoadError if data access fails
   */
  async getQuestionById(id: string): Promise<IQuestion | null> {
    await this.ensureQuestionsLoaded();
    
    const question = this.questions.find(q => q.id === id);
    return question || null;
  }
  
  /**
   * Retrieves all questions belonging to a specific category
   * @param category - The category to filter by
   * @returns Promise resolving to array of questions in the category
   * @throws DataLoadError if data access fails
   */
  async getQuestionsByCategory(category: string): Promise<IQuestion[]> {
    await this.ensureQuestionsLoaded();
    
    return this.questions.filter(q => q.category === category);
  }
  
  /**
   * Gets the total count of available questions
   * @returns Promise resolving to the total number of questions
   * @throws DataLoadError if data access fails
   */
  async getTotalCount(): Promise<number> {
    await this.ensureQuestionsLoaded();
    
    return this.questions.length;
  }
  
  /**
   * Ensures questions are loaded before performing operations
   * @throws DataLoadError if questions cannot be loaded
   */
  private async ensureQuestionsLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadQuestions();
    }
  }
  
  /**
   * Resets the repository state, forcing a reload on next access
   * Useful for testing or when question data has been updated
   */
  public reset(): void {
    this.questions = [];
    this.isLoaded = false;
  }
  
  /**
   * Gets all available categories from loaded questions
   * @returns Promise resolving to array of unique category names
   * @throws DataLoadError if data access fails
   */
  async getAvailableCategories(): Promise<string[]> {
    await this.ensureQuestionsLoaded();
    
    const categories = new Set(this.questions.map(q => q.category));
    return Array.from(categories).sort();
  }
}