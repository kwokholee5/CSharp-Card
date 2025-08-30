import { ApplicationError } from './ApplicationError';

/**
 * Error thrown when data loading operations fail
 */
export class DataLoadError extends ApplicationError {
  readonly code = 'DATA_LOAD_ERROR';
  readonly statusCode = 500;
  
  constructor(source: string, cause?: Error) {
    super(`Failed to load data from ${source}`, cause);
  }
}