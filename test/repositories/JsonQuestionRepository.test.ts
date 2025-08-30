import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JsonQuestionRepository } from '../../src/repositories/JsonQuestionRepository';
import { IQuestionLoader } from '../../src/interfaces/repositories/IQuestionLoader';
import { IQuestionParser } from '../../src/interfaces/repositories/IQuestionParser';
import { IQuestion } from '../../src/interfaces/domain/IQuestion';
import { DataLoadError } from '../../src/models/errors/DataLoadError';

describe('JsonQuestionRepository', () => {
  let repository: JsonQuestionRepository;
  let mockLoader: IQuestionLoader;
  let mockParser: IQuestionParser;
  let mockQuestions: IQuestion[];
  
  beforeEach(() => {
    mockLoader = {
      loadFromJson: vi.fn(),
      loadFromMultipleJson: vi.fn(),
      loadFromDirectory: vi.fn()
    };
    
    mockParser = {
      parseQuestions: vi.fn(),
      parseQuestion: vi.fn(),
      validateQuestionData: vi.fn(),
      validateQuestionsData: vi.fn()
    };
    
    mockQuestions = [
      {
        id: 'test-1',
        text: 'Test question 1',
        options: [],
        category: 'basics',
        difficulty: 'easy' as const,
        explanation: 'Test explanation',
        getCorrectAnswers: () => [0],
        hasMultipleCorrectAnswers: () => false
      },
      {
        id: 'test-2',
        text: 'Test question 2',
        options: [],
        category: 'advanced',
        difficulty: 'hard' as const,
        explanation: 'Test explanation 2',
        getCorrectAnswers: () => [1],
        hasMultipleCorrectAnswers: () => false
      }
    ];
    
    repository = new JsonQuestionRepository(
      mockLoader,
      mockParser,
      ['test1.json', 'test2.json']
    );
  });
  
  describe('loadQuestions', () => {
    it('should load and parse questions successfully', async () => {
      const rawData = [{ id: 'raw-1' }, { id: 'raw-2' }];
      
      vi.mocked(mockLoader.loadFromMultipleJson).mockResolvedValue(rawData as any);
      vi.mocked(mockParser.parseQuestions).mockResolvedValue(mockQuestions);
      
      const result = await repository.loadQuestions();
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-1');
      expect(result[1].id).toBe('test-2');
      expect(mockLoader.loadFromMultipleJson).toHaveBeenCalledWith(['test1.json', 'test2.json']);
      expect(mockParser.parseQuestions).toHaveBeenCalledWith(rawData);
    });
    
    it('should return cached questions on subsequent calls', async () => {
      const rawData = [{ id: 'raw-1' }];
      
      vi.mocked(mockLoader.loadFromMultipleJson).mockResolvedValue(rawData as any);
      vi.mocked(mockParser.parseQuestions).mockResolvedValue(mockQuestions);
      
      // First call
      await repository.loadQuestions();
      
      // Second call
      const result = await repository.loadQuestions();
      
      expect(result).toHaveLength(2);
      expect(mockLoader.loadFromMultipleJson).toHaveBeenCalledTimes(1);
      expect(mockParser.parseQuestions).toHaveBeenCalledTimes(1);
    });
    
    it('should throw DataLoadError when loading fails', async () => {
      vi.mocked(mockLoader.loadFromMultipleJson).mockRejectedValue(new Error('Load failed'));
      
      await expect(repository.loadQuestions()).rejects.toThrow(DataLoadError);
    });
    
    it('should throw DataLoadError when parsing fails', async () => {
      const rawData = [{ id: 'raw-1' }];
      
      vi.mocked(mockLoader.loadFromMultipleJson).mockResolvedValue(rawData as any);
      vi.mocked(mockParser.parseQuestions).mockRejectedValue(new Error('Parse failed'));
      
      await expect(repository.loadQuestions()).rejects.toThrow(DataLoadError);
    });
  });
  
  describe('getQuestionById', () => {
    beforeEach(async () => {
      vi.mocked(mockLoader.loadFromMultipleJson).mockResolvedValue([]);
      vi.mocked(mockParser.parseQuestions).mockResolvedValue(mockQuestions);
      await repository.loadQuestions();
    });
    
    it('should return question when found', async () => {
      const result = await repository.getQuestionById('test-1');
      
      expect(result).toBeDefined();
      expect(result!.id).toBe('test-1');
    });
    
    it('should return null when question not found', async () => {
      const result = await repository.getQuestionById('nonexistent');
      
      expect(result).toBeNull();
    });
  });
  
  describe('getQuestionsByCategory', () => {
    beforeEach(async () => {
      vi.mocked(mockLoader.loadFromMultipleJson).mockResolvedValue([]);
      vi.mocked(mockParser.parseQuestions).mockResolvedValue(mockQuestions);
      await repository.loadQuestions();
    });
    
    it('should return questions in specified category', async () => {
      const result = await repository.getQuestionsByCategory('basics');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
      expect(result[0].category).toBe('basics');
    });
    
    it('should return empty array for nonexistent category', async () => {
      const result = await repository.getQuestionsByCategory('nonexistent');
      
      expect(result).toHaveLength(0);
    });
  });
  
  describe('getTotalCount', () => {
    beforeEach(async () => {
      vi.mocked(mockLoader.loadFromMultipleJson).mockResolvedValue([]);
      vi.mocked(mockParser.parseQuestions).mockResolvedValue(mockQuestions);
      await repository.loadQuestions();
    });
    
    it('should return total number of questions', async () => {
      const result = await repository.getTotalCount();
      
      expect(result).toBe(2);
    });
  });
  
  describe('getAvailableCategories', () => {
    beforeEach(async () => {
      vi.mocked(mockLoader.loadFromMultipleJson).mockResolvedValue([]);
      vi.mocked(mockParser.parseQuestions).mockResolvedValue(mockQuestions);
      await repository.loadQuestions();
    });
    
    it('should return unique categories sorted', async () => {
      const result = await repository.getAvailableCategories();
      
      expect(result).toEqual(['advanced', 'basics']);
    });
  });
  
  describe('reset', () => {
    it('should reset repository state', async () => {
      vi.mocked(mockLoader.loadFromMultipleJson).mockResolvedValue([]);
      vi.mocked(mockParser.parseQuestions).mockResolvedValue(mockQuestions);
      
      // Load questions
      await repository.loadQuestions();
      
      // Reset
      repository.reset();
      
      // Load again - should call loader again
      await repository.loadQuestions();
      
      expect(mockLoader.loadFromMultipleJson).toHaveBeenCalledTimes(2);
    });
  });
});