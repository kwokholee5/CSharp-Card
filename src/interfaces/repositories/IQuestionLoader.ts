/**
 * Raw question data structure as it appears in JSON files.
 * Represents the external data format before transformation to domain models.
 * Supports both multiple-choice and flip-card question types.
 */
export interface RawQuestionData {
  id: string;
  question: string;
  type: string;
  
  // Multiple-choice specific fields
  options?: Array<{
    id: string;
    text: string;
    explanation?: string;
  }>;
  correctAnswerIndex?: number;
  correctAnswerIndices?: number[];
  
  // Flip-card specific fields
  answer?: string;
  
  explanation: string;
  codeExample?: {
    language: string;
    code: string;
    output?: string;
  };
  category: string;
  subcategory?: string;
  difficulty: number;
  tags: string[];
  references?: Array<{
    title: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * Raw JSON file structure containing metadata and questions.
 * Represents the complete structure of question JSON files.
 */
export interface RawQuestionFile {
  $schema: string;
  metadata: {
    category: string;
    subcategory: string;
    fileVersion: number;
    lastUpdated: string;
    questionCount: number;
    avgDifficulty: number;
  };
  questions: RawQuestionData[];
}

/**
 * Interface for loading raw question data from JSON files.
 * Abstracts the file system access and JSON parsing operations.
 * Follows Interface Segregation Principle by focusing only on loading operations.
 */
export interface IQuestionLoader {
  /**
   * Loads raw question data from a JSON file
   * @param filePath - Path to the JSON file containing questions
   * @returns Promise resolving to array of raw question data
   * @throws DataLoadError if file cannot be read or parsed
   */
  loadFromJson(filePath: string): Promise<RawQuestionData[]>;
  
  /**
   * Loads raw question data from multiple JSON files
   * @param filePaths - Array of paths to JSON files
   * @returns Promise resolving to array of raw question data from all files
   * @throws DataLoadError if any file cannot be read or parsed
   */
  loadFromMultipleJson(filePaths: string[]): Promise<RawQuestionData[]>;
  
  /**
   * Discovers and loads all question files from a directory
   * @param directoryPath - Path to directory containing question JSON files
   * @returns Promise resolving to array of raw question data from all discovered files
   * @throws DataLoadError if directory cannot be read or files cannot be parsed
   */
  loadFromDirectory(directoryPath: string): Promise<RawQuestionData[]>;

  /**
   * Discovers question files by testing for their existence
   * @param basePath - Base path to search for question files
   * @returns Promise resolving to array of existing file paths
   */
  discoverQuestionFiles(basePath: string): Promise<string[]>;
}