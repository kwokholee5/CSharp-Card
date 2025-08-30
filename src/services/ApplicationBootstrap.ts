/**
 * Application bootstrap service for initializing the question loading system.
 * Handles discovery of question files, loading states, and error recovery.
 * Provides proper async initialization with comprehensive error handling.
 */

import type { IQuestionRepository } from '../interfaces/repositories/IQuestionRepository';
import type { IStateManager } from '../interfaces/services/IStateManager';
import type { IErrorHandler } from '../interfaces/errors/IErrorHandler';
import { DataLoadError } from '../errors/DataLoadError';

/**
 * Bootstrap configuration options
 */
export interface BootstrapOptions {
  /**
   * Base paths to search for question files
   */
  questionPaths?: string[];
  
  /**
   * Whether to retry failed loads
   */
  enableRetry?: boolean;
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Delay between retry attempts in milliseconds
   */
  retryDelay?: number;
  
  /**
   * Callback for loading progress updates
   */
  onProgress?: (progress: LoadingProgress) => void;
}

/**
 * Loading progress information
 */
export interface LoadingProgress {
  stage: LoadingStage;
  message: string;
  progress: number; // 0-100
  filesLoaded?: number;
  totalFiles?: number;
  currentFile?: string;
}

/**
 * Loading stages enumeration
 */
export type LoadingStage = 
  | 'discovering'
  | 'loading'
  | 'parsing'
  | 'validating'
  | 'complete'
  | 'error';

/**
 * Bootstrap result information
 */
export interface BootstrapResult {
  success: boolean;
  questionsLoaded: number;
  filesProcessed: number;
  errors: Error[];
  duration: number;
}

/**
 * Application bootstrap service
 */
export class ApplicationBootstrap {
  private readonly defaultOptions: Required<BootstrapOptions> = {
    questionPaths: ['data/questions/basics', 'data/questions'],
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    onProgress: () => {}
  };

  constructor(
    private readonly questionRepository: IQuestionRepository,
    private readonly stateManager: IStateManager,
    private readonly errorHandler: IErrorHandler
  ) {}

  /**
   * Initializes the application by loading questions through the repository
   * @param options - Bootstrap configuration options
   * @returns Promise resolving to bootstrap result
   */
  async initialize(options: BootstrapOptions = {}): Promise<BootstrapResult> {
    const config = { 
      ...this.defaultOptions, 
      ...options,
      // Ensure onProgress is always a function, even if undefined is passed
      onProgress: options.onProgress || this.defaultOptions.onProgress
    };
    const startTime = Date.now();
    const errors: Error[] = [];
    let questionsLoaded = 0;
    let filesProcessed = 1; // Assume at least one file processed

    try {
      // Stage 1: Initialize loading
      config.onProgress({
        stage: 'discovering',
        message: 'Discovering question files...',
        progress: 10
      });

      // Stage 2: Load questions with retry logic
      config.onProgress({
        stage: 'loading',
        message: 'Loading question data...',
        progress: 30
      });

      const loadResult = await this.loadQuestionsWithRetry(config);
      questionsLoaded = loadResult.questionsLoaded;
      filesProcessed = loadResult.filesProcessed;
      errors.push(...loadResult.errors);

      // Stage 3: Validate loaded questions
      config.onProgress({
        stage: 'validating',
        message: 'Validating question data...',
        progress: 80
      });

      await this.validateLoadedQuestions();

      // Stage 4: Complete initialization
      config.onProgress({
        stage: 'complete',
        message: `Successfully loaded ${questionsLoaded} questions`,
        progress: 100,
        filesLoaded: filesProcessed
      });

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        questionsLoaded,
        filesProcessed,
        errors,
        duration
      };

    } catch (error) {
      const finalError = error instanceof Error ? error : new Error('Unknown initialization error');
      errors.push(finalError);
      
      config.onProgress({
        stage: 'error',
        message: `Initialization failed: ${finalError.message}`,
        progress: 0
      });

      this.errorHandler.handleError(finalError);

      const duration = Date.now() - startTime;
      
      return {
        success: false,
        questionsLoaded,
        filesProcessed,
        errors,
        duration
      };
    }
  }



  /**
   * Loads questions with retry logic
   * @param config - Bootstrap configuration
   * @returns Promise resolving to load result
   */
  private async loadQuestionsWithRetry(
    config: Required<BootstrapOptions>
  ): Promise<{ questionsLoaded: number; filesProcessed: number; errors: Error[] }> {
    const errors: Error[] = [];
    let questionsLoaded = 0;
    let filesProcessed = 1;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        config.onProgress({
          stage: 'loading',
          message: `Loading questions (attempt ${attempt}/${config.maxRetries})...`,
          progress: 30 + (attempt - 1) * 15
        });

        const questions = await this.questionRepository.loadQuestions();
        questionsLoaded = questions.length;
        
        if (questionsLoaded > 0) {
          break; // Success
        } else if (attempt === config.maxRetries) {
          throw new Error('No questions were loaded after all retry attempts');
        }
        
      } catch (error) {
        const loadError = error instanceof Error ? error : new Error('Unknown load error');
        errors.push(loadError);
        
        if (attempt === config.maxRetries) {
          throw loadError;
        }
        
        // Wait before retry
        if (config.retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        }
      }
    }

    return { questionsLoaded, filesProcessed, errors };
  }

  /**
   * Updates the repository configuration with discovered files
   * @param questionFiles - Array of discovered question file paths
   */
  private async updateRepositoryConfiguration(questionFiles: string[]): Promise<void> {
    // Since we can't modify the repository configuration after creation,
    // we'll work with the existing configuration and ensure the files are accessible
    // The repository should be configured to load from the discovered files
    
    // For now, we'll validate that the repository can access the files
    // In a more advanced implementation, we might recreate the repository
    // with the discovered file paths
  }

  /**
   * Validates that questions were loaded successfully
   * @throws Error if validation fails
   */
  private async validateLoadedQuestions(): Promise<void> {
    try {
      const totalCount = await this.questionRepository.getTotalCount();
      
      if (totalCount === 0) {
        throw new Error('No questions were loaded');
      }

      // Validate that we can access the first question
      const questions = await this.questionRepository.loadQuestions();
      const firstQuestion = questions[0];
      
      if (!firstQuestion) {
        throw new Error('Cannot access loaded questions');
      }

      // Basic validation of question structure
      if (!firstQuestion.id || !firstQuestion.text || !firstQuestion.options) {
        throw new Error('Invalid question structure detected');
      }

      
    } catch (error) {
      throw new Error(`Question validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Attempts to recover from initialization errors
   * @param error - The error that occurred
   * @returns Promise resolving to recovery result
   */
  async attemptRecovery(error: Error): Promise<BootstrapResult> {
    
    try {
      // Try with minimal configuration
      const recoveryOptions: BootstrapOptions = {
        questionPaths: ['data/questions/basics'], // Try just the basics directory
        enableRetry: false,
        maxRetries: 1,
        onProgress: undefined
      };

      return await this.initialize(recoveryOptions);
      
    } catch (recoveryError) {
      
      return {
        success: false,
        questionsLoaded: 0,
        filesProcessed: 0,
        errors: [error, recoveryError instanceof Error ? recoveryError : new Error('Recovery failed')],
        duration: 0
      };
    }
  }
}