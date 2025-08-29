/**
 * Error thrown when validation operations fail.
 * Extends the base Error class to provide specific error information for validation failures.
 */
export class ValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 400;
  
  /**
   * Creates a new ValidationError instance
   * @param message - The main error message
   * @param validationErrors - Array of specific validation error messages
   */
  constructor(message: string, public readonly validationErrors: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}