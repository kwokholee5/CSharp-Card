import { IErrorHandler } from '../interfaces/errors/IErrorHandler';
import { ApplicationError } from '../errors/ApplicationError';
import { QuestionNotFoundError } from '../errors/QuestionNotFoundError';
import { ValidationError } from '../errors/ValidationError';
import { DataLoadError } from '../errors/DataLoadError';
import { NavigationError } from '../errors/NavigationError';

/**
 * Centralized error handler for application-specific errors
 */
export class ApplicationErrorHandler implements IErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof ApplicationError;
  }

  handleError(error: Error): void {
    if (error instanceof ApplicationError) {
      console.error(`[${error.code}] ${error.message}`);
      
      // Log the cause if available
      if (error.cause) {
        console.error('Caused by:', error.cause);
      }

      // Handle specific error types
      switch (error.code) {
        case 'QUESTION_NOT_FOUND':
          this.handleQuestionNotFound(error as QuestionNotFoundError);
          break;
        case 'VALIDATION_ERROR':
          this.handleValidationError(error as ValidationError);
          break;
        case 'DATA_LOAD_ERROR':
          this.handleDataLoadError(error as DataLoadError);
          break;
        case 'NAVIGATION_ERROR':
          this.handleNavigationError(error as NavigationError);
          break;
        default:
          this.handleGenericApplicationError(error);
          break;
      }
    } else {
      // Handle non-application errors
      console.error('Unexpected error:', error);
    }
  }

  private handleQuestionNotFound(error: QuestionNotFoundError): void {
    // Log the specific question ID that wasn't found
    console.warn(`Question not found. This may indicate a data integrity issue.`);
    // In a real application, this might trigger navigation to the first question
    // or display a user-friendly error message
  }

  private handleValidationError(error: ValidationError): void {
    // Log validation details
    console.error('Validation failed:', error.validationErrors);
    // In a real application, this might display validation errors to the user
  }

  private handleDataLoadError(error: DataLoadError): void {
    // Log data loading issues
    console.error('Data loading failed. Check data source availability and format.');
    // In a real application, this might show a retry option or fallback data
  }

  private handleNavigationError(error: NavigationError): void {
    // Log navigation issues
    console.error('Navigation failed. This may indicate invalid state.');
    // In a real application, this might reset navigation state or show error message
  }

  private handleGenericApplicationError(error: ApplicationError): void {
    // Handle any other application errors
    console.error('Application error occurred:', error.message);
  }
}

/**
 * Global error handler that can handle both application and system errors
 */
export class GlobalErrorHandler implements IErrorHandler {
  private readonly applicationErrorHandler: ApplicationErrorHandler;

  constructor() {
    this.applicationErrorHandler = new ApplicationErrorHandler();
  }

  canHandle(error: Error): boolean {
    // Can handle any error
    return true;
  }

  handleError(error: Error): void {
    if (this.applicationErrorHandler.canHandle(error)) {
      this.applicationErrorHandler.handleError(error);
    } else {
      // Handle system errors, network errors, etc.
      console.error('System error:', error);
      
      // In a real application, this might:
      // - Send error reports to monitoring service
      // - Display generic error message to user
      // - Attempt recovery actions
    }
  }
}