import { ApplicationError } from './ApplicationError';

/**
 * Error thrown when a requested question cannot be found
 */
export class QuestionNotFoundError extends ApplicationError {
  readonly code = 'QUESTION_NOT_FOUND';
  readonly statusCode = 404;
  
  constructor(questionId: string, cause?: Error) {
    super(`Question with id ${questionId} not found`, cause);
  }
}