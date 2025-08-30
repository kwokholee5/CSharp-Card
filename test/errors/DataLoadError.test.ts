import { DataLoadError } from '../../src/errors/DataLoadError';
import { ApplicationError } from '../../src/errors/ApplicationError';

describe('DataLoadError', () => {
  describe('constructor', () => {
    it('should create error with source', () => {
      const source = 'questions.json';
      const error = new DataLoadError(source);
      
      expect(error.message).toBe(`Failed to load data from ${source}`);
      expect(error.code).toBe('DATA_LOAD_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('DataLoadError');
    });

    it('should create error with source and cause', () => {
      const source = 'questions.json';
      const cause = new Error('File not found');
      const error = new DataLoadError(source, cause);
      
      expect(error.message).toBe(`Failed to load data from ${source}`);
      expect(error.cause).toBe(cause);
    });

    it('should be instance of ApplicationError', () => {
      const error = new DataLoadError('test-source');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(DataLoadError);
    });
  });
});