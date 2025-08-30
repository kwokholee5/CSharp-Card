import { IQuestionLoader, RawQuestionData, RawQuestionFile } from '../interfaces/repositories/IQuestionLoader';
import { DataLoadError } from '../models/errors/DataLoadError';

/**
 * Concrete implementation of IQuestionLoader for loading questions from JSON files.
 * Handles file system access and JSON parsing operations.
 * Follows Single Responsibility Principle by focusing only on data loading.
 */
export class QuestionLoader implements IQuestionLoader {
  
  /**
   * Loads raw question data from a JSON file
   * @param filePath - Path to the JSON file containing questions
   * @returns Promise resolving to array of raw question data
   * @throws DataLoadError if file cannot be read or parsed
   */
  async loadFromJson(filePath: string): Promise<RawQuestionData[]> {
    try {
      // Ensure path starts with '/' for absolute URL
      const absolutePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
      const response = await fetch(absolutePath);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const jsonData: RawQuestionFile = await response.json();
      
      if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
        throw new Error('Invalid JSON structure: missing or invalid questions array');
      }
      
      return jsonData.questions;
    } catch (error) {
      throw new DataLoadError(filePath, error as Error);
    }
  }
  
  /**
   * Loads raw question data from multiple JSON files
   * @param filePaths - Array of paths to JSON files
   * @returns Promise resolving to array of raw question data from all files
   * @throws DataLoadError if any file cannot be read or parsed
   */
  async loadFromMultipleJson(filePaths: string[]): Promise<RawQuestionData[]> {
    const allQuestions: RawQuestionData[] = [];
    
    for (const filePath of filePaths) {
      try {
        const questions = await this.loadFromJson(filePath);
        allQuestions.push(...questions);
      } catch (error) {
        // Re-throw with additional context about which file failed
        if (error instanceof DataLoadError) {
          throw error;
        }
        throw new DataLoadError(`${filePath} (in batch load)`, error as Error);
      }
    }
    
    return allQuestions;
  }
  
  /**
   * Discovers and loads all question files from a directory
   * Note: In a browser environment, this method requires the file paths to be known in advance
   * or provided through a manifest file, as browsers cannot enumerate directory contents.
   * @param directoryPath - Path to directory containing question JSON files
   * @returns Promise resolving to array of raw question data from all discovered files
   * @throws DataLoadError if directory cannot be read or files cannot be parsed
   */
  async loadFromDirectory(directoryPath: string): Promise<RawQuestionData[]> {
    // In a browser environment, we need to know the file names in advance
    // Updated to match actual files in the project including new 100 questions
    const knownFiles = [
      // Existing files
      'data-types-mc.json',
      'variables.json',
      'control-flow-mc.json',
      'oop-mc.json',
      'collections-mc.json',
      'linq-mc.json',
      'async-mc.json',
      'exceptions-mc.json',
      'generics-mc.json',
      
      // New question files (100 questions total)
      'console-output-mc.json',
      'operators-mc.json',
      'oop-fundamentals-mc.json',
      'async-await-mc.json',
      'reflection-mc.json'
    ];
    
    const filePaths = knownFiles.map(file => `${directoryPath}/${file}`);
    const allQuestions: RawQuestionData[] = [];
    
    for (const filePath of filePaths) {
      try {
        const questions = await this.loadFromJson(filePath);
        allQuestions.push(...questions);
      } catch (error) {
        // For directory loading, we continue if some files are missing
        // but still throw for actual parsing errors
        if (error instanceof DataLoadError && error.message.includes('HTTP 404')) {
          continue; // File doesn't exist, skip it
        }
        throw error;
      }
    }
    
    if (allQuestions.length === 0) {
      throw new DataLoadError(directoryPath, new Error('No valid question files found in directory'));
    }
    
    return allQuestions;
  }

  /**
   * Discovers question files by testing for their existence
   * @param basePath - Base path to search for question files
   * @returns Promise resolving to array of existing file paths
   */
  async discoverQuestionFiles(basePath: string): Promise<string[]> {
    const knownFiles = [
      'data-types-mc.json',
      'variables.json',
      'control-flow-mc.json',
      'oop-mc.json',
      'collections-mc.json',
      'linq-mc.json',
      'async-mc.json',
      'exceptions-mc.json',
      'generics-mc.json'
    ];

    const discoveredFiles: string[] = [];

    for (const fileName of knownFiles) {
      const filePath = `${basePath}/${fileName}`;
      
      try {
        // Test if file exists by attempting to fetch headers
        const response = await fetch(filePath, { method: 'HEAD' });
        if (response.ok) {
          discoveredFiles.push(filePath);
        }
      } catch (error) {
        // File doesn't exist or can't be accessed, continue
        continue;
      }
    }

    return discoveredFiles;
  }
}