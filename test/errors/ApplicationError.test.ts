import { ApplicationError } from '../../src/errors/ApplicationError';

// Create a concrete implementation for testing
class TestApplicationError extends ApplicationError {
  readonly code = 'TEST_ERROR';
  readonly statusCode = 500;
}

describe('ApplicationError', () => {
  describe('constructor', () => {
    it('should create error with message', () => {
      const error = new TestApplicationError('Test error message');
      
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('TestApplicationError');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.cause).toBeUndefined();
    });

    it('should create error with message and cause', () => {
      const cause = new Error('Original error');
      const error = new TestApplicationError('Test error message', cause);
      
      expect(error.message).toBe('Test error message');
      expect(error.cause).toBe(cause);
    });

    it('should be instance of Error', () => {
      const error = new TestApplicationError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
    });

    it('should have proper stack trace', () => {
      const error = new TestApplicationError('Test error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestApplicationError');
    });
  });
});