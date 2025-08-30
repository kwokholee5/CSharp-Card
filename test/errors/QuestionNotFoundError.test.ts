import { QuestionNotFoundError } from '../../src/errors/QuestionNotFoundError';
import { ApplicationError } from '../../src/errors/ApplicationError';

describe('QuestionNotFoundError', () => {
  describe('constructor', () => {
    it('should create error with question ID', () => {
      const questionId = 'test-question-123';
      const error = new QuestionNotFoundError(questionId);
      
      expect(error.message).toBe(`Question with id ${questionId} not found`);
      expect(error.code).toBe('QUESTION_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('QuestionNotFoundError');
    });

    it('should create error with question ID and cause', () => {
      const questionId = 'test-question-123';
      const cause = new Error('Database connection failed');
      const error = new QuestionNotFoundError(questionId, cause);
      
      expect(error.message).toBe(`Question with id ${questionId} not found`);
      expect(error.cause).toBe(cause);
    });

    it('should be instance of ApplicationError', () => {
      const error = new QuestionNotFoundError('test-id');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(QuestionNotFoundError);
    });
  });
});