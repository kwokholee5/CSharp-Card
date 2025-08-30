import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionParser } from '../../src/repositories/QuestionParser';
import { ValidationError } from '../../src/models/errors/ValidationError';
import { RawQuestionData } from '../../src/interfaces/repositories/IQuestionLoader';

describe('QuestionParser', () => {
  let questionParser: QuestionParser;
  
  beforeEach(() => {
    questionParser = new QuestionParser();
  });
  
  const createValidRawQuestion = (): RawQuestionData => ({
    id: 'test-1',
    question: 'What is the correct syntax?',
    type: 'multiple-choice',
    options: [
      { id: 'a', text: 'Option A', explanation: 'Explanation A' },
      { id: 'b', text: 'Option B', explanation: 'Explanation B' }
    ],
    correctAnswerIndex: 0,
    explanation: 'The correct answer is A',
    category: 'basics',
    subcategory: 'syntax',
    difficulty: 2,
    tags: ['syntax', 'basics'],
    createdAt: '2025-08-29T12:00:00Z',
    updatedAt: '2025-08-29T12:00:00Z',
    version: 1
  });
  
  describe('validateQuestionData', () => {
    it('should validate correct question data', () => {
      const rawQuestion = createValidRawQuestion();
      
      const result = questionParser.validateQuestionData(rawQuestion);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect missing required fields', () => {
      const rawQuestion = createValidRawQuestion();
      delete (rawQuestion as any).id;
      delete (rawQuestion as any).question;
      
      const result = questionParser.validateQuestionData(rawQuestion);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question ID is required and must be a string');
      expect(result.errors).toContain('Question text is required and must be a string');
    });
    
    it('should detect invalid options', () => {
      const rawQuestion = createValidRawQuestion();
      rawQuestion.options = [];
      
      const result = questionParser.validateQuestionData(rawQuestion);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question must have at least one option');
    });
    
    it('should detect out of bounds correct answer index', () => {
      const rawQuestion = createValidRawQuestion();
      rawQuestion.correctAnswerIndex = 5; // Only 2 options available
      
      const result = questionParser.validateQuestionData(rawQuestion);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Correct answer index out of bounds: 5');
    });
    
    it('should detect invalid difficulty', () => {
      const rawQuestion = createValidRawQuestion();
      rawQuestion.difficulty = 10; // Should be 1-5
      
      const result = questionParser.validateQuestionData(rawQuestion);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Difficulty must be a number between 1 and 5');
    });
    
    it('should validate correctAnswerIndices array', () => {
      const rawQuestion = createValidRawQuestion();
      delete (rawQuestion as any).correctAnswerIndex;
      rawQuestion.correctAnswerIndices = [0, 1];
      
      const result = questionParser.validateQuestionData(rawQuestion);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect out of bounds correctAnswerIndices', () => {
      const rawQuestion = createValidRawQuestion();
      delete (rawQuestion as any).correctAnswerIndex;
      rawQuestion.correctAnswerIndices = [0, 5]; // Index 5 is out of bounds
      
      const result = questionParser.validateQuestionData(rawQuestion);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Correct answer indices out of bounds: 5');
    });
  });
  
  describe('parseQuestion', () => {
    it('should parse valid question data', async () => {
      const rawQuestion = createValidRawQuestion();
      
      const result = await questionParser.parseQuestion(rawQuestion);
      
      expect(result.id).toBe('test-1');
      expect(result.text).toBe('What is the correct syntax?');
      expect(result.options).toHaveLength(2);
      expect(result.getCorrectAnswers()).toEqual([0]);
      expect(result.hasMultipleCorrectAnswers()).toBe(false);
      expect(result.difficulty).toBe('easy');
    });
    
    it('should parse question with multiple correct answers', async () => {
      const rawQuestion = createValidRawQuestion();
      delete (rawQuestion as any).correctAnswerIndex;
      rawQuestion.correctAnswerIndices = [0, 1];
      
      const result = await questionParser.parseQuestion(rawQuestion);
      
      expect(result.getCorrectAnswers()).toEqual([0, 1]);
      expect(result.hasMultipleCorrectAnswers()).toBe(true);
    });
    
    it('should parse question with code example', async () => {
      const rawQuestion = createValidRawQuestion();
      rawQuestion.codeExample = {
        language: 'csharp',
        code: 'int x = 5;',
        output: '5'
      };
      
      const result = await questionParser.parseQuestion(rawQuestion);
      
      expect(result.codeExample).toBeDefined();
      expect(result.codeExample!.code).toBe('int x = 5;');
      expect(result.codeExample!.language).toBe('csharp');
      expect(result.codeExample!.output).toBe('5');
    });
    
    it('should map difficulty levels correctly', async () => {
      const testCases = [
        { difficulty: 1, expected: 'easy' },
        { difficulty: 2, expected: 'easy' },
        { difficulty: 3, expected: 'medium' },
        { difficulty: 4, expected: 'hard' },
        { difficulty: 5, expected: 'hard' }
      ];
      
      for (const testCase of testCases) {
        const rawQuestion = createValidRawQuestion();
        rawQuestion.difficulty = testCase.difficulty;
        
        const result = await questionParser.parseQuestion(rawQuestion);
        
        expect(result.difficulty).toBe(testCase.expected);
      }
    });
    
    it('should throw ValidationError for invalid data', async () => {
      const rawQuestion = createValidRawQuestion();
      delete (rawQuestion as any).id;
      
      await expect(questionParser.parseQuestion(rawQuestion))
        .rejects.toThrow(ValidationError);
    });
  });
  
  describe('parseQuestions', () => {
    it('should parse array of valid questions', async () => {
      const rawQuestions = [
        createValidRawQuestion(),
        { ...createValidRawQuestion(), id: 'test-2' }
      ];
      
      const result = await questionParser.parseQuestions(rawQuestions);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-1');
      expect(result[1].id).toBe('test-2');
    });
    
    it('should throw ValidationError for duplicate IDs', async () => {
      const rawQuestions = [
        createValidRawQuestion(),
        createValidRawQuestion() // Same ID
      ];
      
      await expect(questionParser.parseQuestions(rawQuestions))
        .rejects.toThrow(ValidationError);
    });
    
    it('should throw ValidationError for empty array', async () => {
      await expect(questionParser.parseQuestions([]))
        .rejects.toThrow(ValidationError);
    });
  });
});