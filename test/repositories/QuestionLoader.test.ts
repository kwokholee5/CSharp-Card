import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestionLoader } from '../../src/repositories/QuestionLoader';
import { DataLoadError } from '../../src/models/errors/DataLoadError';

// Mock fetch globally
global.fetch = vi.fn();

describe('QuestionLoader', () => {
  let questionLoader: QuestionLoader;
  
  beforeEach(() => {
    questionLoader = new QuestionLoader();
    vi.clearAllMocks();
  });
  
  describe('loadFromJson', () => {
    it('should load questions from valid JSON file', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          questions: [
            {
              id: 'test-1',
              question: 'Test question',
              type: 'multiple-choice',
              options: [{ id: 'a', text: 'Option A' }],
              correctAnswerIndex: 0,
              explanation: 'Test explanation',
              category: 'test',
              difficulty: 2
            }
          ]
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const result = await questionLoader.loadFromJson('test.json');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
      expect(fetch).toHaveBeenCalledWith('test.json');
    });
    
    it('should throw DataLoadError when fetch fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(questionLoader.loadFromJson('nonexistent.json'))
        .rejects.toThrow(DataLoadError);
    });
    
    it('should throw DataLoadError when JSON is invalid', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          // Missing questions array
          metadata: {}
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      await expect(questionLoader.loadFromJson('invalid.json'))
        .rejects.toThrow(DataLoadError);
    });
    
    it('should throw DataLoadError when JSON parsing fails', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      await expect(questionLoader.loadFromJson('corrupt.json'))
        .rejects.toThrow(DataLoadError);
    });
  });
  
  describe('loadFromMultipleJson', () => {
    it('should load questions from multiple files', async () => {
      const mockResponse1 = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          questions: [{ id: 'test-1', question: 'Test 1' }]
        })
      };
      
      const mockResponse2 = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          questions: [{ id: 'test-2', question: 'Test 2' }]
        })
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);
      
      const result = await questionLoader.loadFromMultipleJson(['file1.json', 'file2.json']);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-1');
      expect(result[1].id).toBe('test-2');
    });
    
    it('should throw DataLoadError if any file fails to load', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ questions: [{ id: 'test-1' }] })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });
      
      await expect(questionLoader.loadFromMultipleJson(['file1.json', 'file2.json']))
        .rejects.toThrow(DataLoadError);
    });
  });
  
  describe('loadFromDirectory', () => {
    it('should load questions from directory with existing files', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          questions: [{ id: 'test-1', question: 'Test question' }]
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const result = await questionLoader.loadFromDirectory('data/questions/basics');
      
      expect(result.length).toBeGreaterThan(0);
      expect(fetch).toHaveBeenCalled();
    });
    
    it('should throw DataLoadError if no valid files found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(questionLoader.loadFromDirectory('nonexistent'))
        .rejects.toThrow(DataLoadError);
    });
  });
});