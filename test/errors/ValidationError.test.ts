import { ValidationError } from '../../src/errors/ValidationError';
import { ApplicationError } from '../../src/errors/ApplicationError';

describe('ValidationError', () => {
  describe('constructor', () => {
    it('should create error with message and validation errors', () => {
      const message = 'Validation failed';
      const validationErrors = ['Field is required', 'Invalid format'];
      const error = new ValidationError(message, validationErrors);
      
      expect(error.message).toBe(message);
      expect(error.validationErrors).toEqual(validationErrors);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should create error with empty validation errors array', () => {
      const message = 'Validation failed';
      const validationErrors: string[] = [];
      const error = new ValidationError(message, validationErrors);
      
      expect(error.validationErrors).toEqual([]);
    });

    it('should create error with cause', () => {
      const message = 'Validation failed';
      const validationErrors = ['Field is required'];
      const cause = new Error('Schema validation failed');
      const error = new ValidationError(message, validationErrors, cause);
      
      expect(error.cause).toBe(cause);
    });

    it('should be instance of ApplicationError', () => {
      const error = new ValidationError('Test', []);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });
});