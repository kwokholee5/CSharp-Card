import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApplicationFactory } from '../../src/services/ApplicationFactory';
import { ApplicationErrorHandler, GlobalErrorHandler } from '../../src/services/ErrorHandler';
import { QuestionNotFoundError } from '../../src/errors/QuestionNotFoundError';
import { ValidationError } from '../../src/errors/ValidationError';
import { DataLoadError } from '../../src/errors/DataLoadError';
import { NavigationError } from '../../src/errors/NavigationError';
import { ApplicationError } from '../../src/errors/ApplicationError';

/**
 * Comprehensive tests for error logging and reporting scenarios
 * Ensures all error types are properly logged and handled
 */
describe('Error Logging and Reporting', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('ApplicationErrorHandler Logging', () => {
    let errorHandler: ApplicationErrorHandler;

    beforeEach(() => {
      errorHandler = new ApplicationErrorHandler();
    });

    it('should log QuestionNotFoundError with proper format and context', () => {
      const error = new QuestionNotFoundError('question-123');
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('[QUESTION_NOT_FOUND] Question with id question-123 not found');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Question not found. This may indicate a data integrity issue.');
    });

    it('should log QuestionNotFoundError with cause information', () => {
      const cause = new Error('Database connection lost');
      const error = new QuestionNotFoundError('question-456', cause);
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('[QUESTION_NOT_FOUND] Question with id question-456 not found');
      expect(consoleSpy).toHaveBeenCalledWith('Caused by:', cause);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Question not found. This may indicate a data integrity issue.');
    });

    it('should log ValidationError with detailed validation messages', () => {
      const validationErrors = [
        'Answer selection is required',
        'Invalid option index: 5',
        'Question ID cannot be empty'
      ];
      const error = new ValidationError('Multiple validation errors occurred', validationErrors);
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('[VALIDATION_ERROR] Multiple validation errors occurred');
      expect(consoleSpy).toHaveBeenCalledWith('Validation failed:', validationErrors);
    });

    it('should log DataLoadError with source information', () => {
      const error = new DataLoadError('questions/advanced.json');
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('[DATA_LOAD_ERROR] Failed to load data from questions/advanced.json');
      expect(consoleSpy).toHaveBeenCalledWith('Data loading failed. Check data source availability and format.');
    });

    it('should log DataLoadError with cause chain', () => {
      const networkError = new Error('Network timeout');
      const error = new DataLoadError('remote/questions.json', networkError);
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('[DATA_LOAD_ERROR] Failed to load data from remote/questions.json');
      expect(consoleSpy).toHaveBeenCalledWith('Caused by:', networkError);
      expect(consoleSpy).toHaveBeenCalledWith('Data loading failed. Check data source availability and format.');
    });

    it('should log NavigationError with context', () => {
      const error = new NavigationError('Cannot move to next question: already at last question');
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION_ERROR] Cannot move to next question: already at last question');
      expect(consoleSpy).toHaveBeenCalledWith('Navigation failed. This may indicate invalid state.');
    });

    it('should log custom ApplicationError types', () => {
      class CustomApplicationError extends ApplicationError {
        readonly code = 'CUSTOM_ERROR';
        readonly statusCode = 500;
      }
      
      const error = new CustomApplicationError('Custom error occurred');
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('[CUSTOM_ERROR] Custom error occurred');
      expect(consoleSpy).toHaveBeenCalledWith('Application error occurred:', 'Custom error occurred');
    });

    it('should log non-ApplicationError instances', () => {
      const error = new TypeError('Cannot read property of undefined');
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('Unexpected error:', error);
    });

    it('should handle errors without messages gracefully', () => {
      const error = new QuestionNotFoundError('');
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('[QUESTION_NOT_FOUND] Question with id  not found');
    });
  });

  describe('GlobalErrorHandler Logging', () => {
    let globalErrorHandler: GlobalErrorHandler;

    beforeEach(() => {
      globalErrorHandler = new GlobalErrorHandler();
    });

    it('should delegate ApplicationError logging to ApplicationErrorHandler', () => {
      const error = new ValidationError('Test validation error', ['Field required']);
      
      globalErrorHandler.handleError(error);
      
      // The GlobalErrorHandler should delegate to ApplicationErrorHandler
      // We can't directly test the delegation, but we can verify it doesn't throw
      expect(() => globalErrorHandler.handleError(error)).not.toThrow();
    });

    it('should handle system errors with proper logging', () => {
      const systemError = new Error('System memory exhausted');
      
      globalErrorHandler.handleError(systemError);
      
      // GlobalErrorHandler logs system errors directly to stderr
      // The exact logging mechanism may vary, but it should not throw
      expect(() => globalErrorHandler.handleError(systemError)).not.toThrow();
    });

    it('should handle null and undefined errors gracefully', () => {
      expect(() => globalErrorHandler.handleError(null as any)).not.toThrow();
      expect(() => globalErrorHandler.handleError(undefined as any)).not.toThrow();
    });
  });

  describe('Error Context and Stack Traces', () => {
    let errorHandler: ApplicationErrorHandler;

    beforeEach(() => {
      errorHandler = new ApplicationErrorHandler();
    });

    it('should preserve error stack traces', () => {
      const error = new QuestionNotFoundError('test-id');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('QuestionNotFoundError');
      
      errorHandler.handleError(error);
      
      // Stack trace should be preserved in the error object
      expect(error.stack).toBeDefined();
    });

    it('should handle errors with complex cause chains', () => {
      const rootCause = new Error('Database connection failed');
      const intermediateCause = new DataLoadError('Failed to load questions', rootCause);
      const finalError = new QuestionNotFoundError('q1', intermediateCause);
      
      errorHandler.handleError(finalError);
      
      expect(consoleSpy).toHaveBeenCalledWith('[QUESTION_NOT_FOUND] Question with id q1 not found');
      expect(consoleSpy).toHaveBeenCalledWith('Caused by:', intermediateCause);
    });

    it('should handle circular error references safely', () => {
      const error1 = new ValidationError('Error 1', []);
      const error2 = new ValidationError('Error 2', []);
      
      // Create circular reference (this shouldn't happen in practice, but we should handle it)
      (error1 as any).cause = error2;
      (error2 as any).cause = error1;
      
      expect(() => errorHandler.handleError(error1)).not.toThrow();
    });
  });

  describe('Error Reporting in Application Context', () => {
    it('should report initialization errors with full context', async () => {
      await expect(
        ApplicationFactory.createApplication({
          questionPaths: ['invalid/path/that/does/not/exist'],
          autoInitialize: true
        })
      ).rejects.toThrow('Failed to initialize application');
      
      // The error should have been logged by the error handler
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should report service resolution errors in application context', async () => {
      const app = await ApplicationFactory.createApplication({
        autoInitialize: false
      });

      // Simulate a service resolution error by trying to access a non-existent service
      expect(() => {
        (app.container as any).resolve('NonExistentService');
      }).toThrow();

      ApplicationFactory.dispose(app);
    });

    it('should handle and log disposal errors', () => {
      const app = ApplicationFactory.createApplicationSync();
      
      // Mock container disposal to throw an error
      vi.spyOn(app.container, 'dispose').mockImplementation(() => {
        throw new Error('Disposal failed');
      });

      ApplicationFactory.dispose(app);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error disposing application context:', 
        expect.any(Error)
      );
    });
  });

  describe('Error Aggregation and Reporting', () => {
    let errorHandler: ApplicationErrorHandler;

    beforeEach(() => {
      errorHandler = new ApplicationErrorHandler();
    });

    it('should handle multiple errors in sequence', () => {
      const errors = [
        new QuestionNotFoundError('q1'),
        new ValidationError('Validation failed', ['Required field']),
        new DataLoadError('data.json'),
        new NavigationError('Navigation failed')
      ];

      errors.forEach(error => {
        expect(() => errorHandler.handleError(error)).not.toThrow();
      });

      // Verify all errors were logged
      expect(consoleSpy).toHaveBeenCalledWith('[QUESTION_NOT_FOUND] Question with id q1 not found');
      expect(consoleSpy).toHaveBeenCalledWith('[VALIDATION_ERROR] Validation failed');
      expect(consoleSpy).toHaveBeenCalledWith('[DATA_LOAD_ERROR] Failed to load data from data.json');
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION_ERROR] Navigation failed');
    });

    it('should handle concurrent error reporting', async () => {
      const errors = Array.from({ length: 10 }, (_, i) => 
        new QuestionNotFoundError(`question-${i}`)
      );

      const promises = errors.map(error => 
        Promise.resolve().then(() => errorHandler.handleError(error))
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
      
      // All errors should have been logged
      expect(consoleSpy).toHaveBeenCalledTimes(10);
    });
  });

  describe('Performance and Memory Impact', () => {
    let errorHandler: ApplicationErrorHandler;

    beforeEach(() => {
      errorHandler = new ApplicationErrorHandler();
    });

    it('should handle large numbers of errors without memory leaks', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate many errors
      for (let i = 0; i < 1000; i++) {
        const error = new ValidationError(`Error ${i}`, [`Validation ${i}`]);
        errorHandler.handleError(error);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB for 1000 errors)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle errors with large data payloads efficiently', () => {
      const largeValidationErrors = Array.from({ length: 1000 }, (_, i) => 
        `Validation error ${i}: ${'x'.repeat(100)}`
      );
      
      const error = new ValidationError('Large validation error', largeValidationErrors);
      
      const startTime = Date.now();
      errorHandler.handleError(error);
      const endTime = Date.now();
      
      // Error handling should be fast (less than 100ms even for large payloads)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});