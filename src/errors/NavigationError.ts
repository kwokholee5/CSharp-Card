import { ApplicationError } from './ApplicationError';

/**
 * Error thrown when navigation operations fail
 */
export class NavigationError extends ApplicationError {
  readonly code = 'NAVIGATION_ERROR';
  readonly statusCode = 400;
  
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}