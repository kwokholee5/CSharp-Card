import { NavigationError } from '../../src/errors/NavigationError';
import { ApplicationError } from '../../src/errors/ApplicationError';

describe('NavigationError', () => {
  describe('constructor', () => {
    it('should create error with message', () => {
      const message = 'Cannot navigate to next question';
      const error = new NavigationError(message);
      
      expect(error.message).toBe(message);
      expect(error.code).toBe('NAVIGATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('NavigationError');
    });

    it('should create error with message and cause', () => {
      const message = 'Cannot navigate to next question';
      const cause = new Error('No more questions available');
      const error = new NavigationError(message, cause);
      
      expect(error.message).toBe(message);
      expect(error.cause).toBe(cause);
    });

    it('should be instance of ApplicationError', () => {
      const error = new NavigationError('Test navigation error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(NavigationError);
    });
  });
});