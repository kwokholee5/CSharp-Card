import { ApplicationError } from './ApplicationError';

/**
 * Error thrown when validation fails
 */
export class ValidationError extends ApplicationError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  
  constructor(message: string, public readonly validationErrors: string[], cause?: Error) {
    super(message, cause);
  }
}