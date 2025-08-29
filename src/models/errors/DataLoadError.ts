/**
 * Error thrown when data loading operations fail.
 * Extends the base Error class to provide specific error information for data access failures.
 */
export class DataLoadError extends Error {
  public readonly code = 'DATA_LOAD_ERROR';
  public readonly statusCode = 500;
  
  /**
   * Creates a new DataLoadError instance
   * @param source - The source of the data that failed to load (e.g., file path, URL)
   * @param cause - The underlying error that caused the failure (optional)
   */
  constructor(source: string, cause?: Error) {
    super(`Failed to load data from ${source}`);
    this.name = 'DataLoadError';
    
    if (cause) {
      this.cause = cause;
      this.stack = cause.stack;
    }
  }
}