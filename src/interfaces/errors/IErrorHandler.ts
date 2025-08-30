/**
 * Interface for handling application errors
 */
export interface IErrorHandler {
  /**
   * Handles an error appropriately based on its type
   * @param error The error to handle
   */
  handleError(error: Error): void;

  /**
   * Determines if this handler can handle the given error
   * @param error The error to check
   * @returns True if this handler can handle the error
   */
  canHandle(error: Error): boolean;
}