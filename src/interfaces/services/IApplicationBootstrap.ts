/**
 * Interface for application bootstrap service.
 * Defines the contract for initializing the question loading system.
 */

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
 * Interface for application bootstrap service
 */
export interface IApplicationBootstrap {
  /**
   * Initializes the application by discovering and loading all question files
   * @param options - Bootstrap configuration options
   * @returns Promise resolving to bootstrap result
   */
  initialize(options?: BootstrapOptions): Promise<BootstrapResult>;

  /**
   * Attempts to recover from initialization errors
   * @param error - The error that occurred
   * @returns Promise resolving to recovery result
   */
  attemptRecovery(error: Error): Promise<BootstrapResult>;
}