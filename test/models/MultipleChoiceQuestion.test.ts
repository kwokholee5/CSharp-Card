import { describe, it, expect } from 'vitest';
import { MultipleChoiceQuestion } from '../../src/models/MultipleChoiceQuestion';
import { CodeExample } from '../../src/models/CodeExample';
import { Option } from '../../src/models/Option';
import { QuestionDifficulty } from '../../src/interfaces/domain';

describe('MultipleChoiceQuestion', () => {
  const validOptions = [
    new Option('1', 'Option A'),
    new Option('2', 'Option B'),
    new Option('3', 'Option C'),
    new Option('4', 'Option D')
  ];

  const validCodeExample = new CodeExample(
    'int x = 5;\nConsole.WriteLine(x);',
    'csharp',
    '5'
  );

  describe('constructor', () => {
    it('should create a valid question with all required parameters', () => {
      const question = new MultipleChoiceQuestion(
        'q1',
        'What is the output?',
        validOptions,
        [0],
        'The answer is A because...',
        'basics',
        'easy'
      );

      expect(question.id).toBe('q1');
      expect(question.text).toBe('What is the output?');
      expect(question.options).toHaveLength(4);
      expect(question.getCorrectAnswers()).toEqual([0]);
      expect(question.explanation).toBe('The answer is A because...');
      expect(question.category).toBe('basics');
      expect(question.difficulty).toBe('easy');
      expect(question.codeExample).toBeUndefined();
    });

    it('should create a valid question with code example', () => {
      const question = new MultipleChoiceQuestion(
        'q2',
        'What is the output?',
        validOptions,
        [1, 2],
        'The answer is B and C because...',
        'advanced',
        'hard',
        validCodeExample
      );

      expect(question.codeExample).toBeDefined();
      expect(question.codeExample?.code).toBe('int x = 5;\nConsole.WriteLine(x);');
      expect(question.hasMultipleCorrectAnswers()).toBe(true);
    });

    it('should throw error for empty ID', () => {
      expect(() => {
        new MultipleChoiceQuestion(
          '',
          'What is the output?',
          validOptions,
          [0],
          'Explanation',
          'basics',
          'easy'
        );
      }).toThrow('Question ID cannot be empty');
    });

    it('should throw error for whitespace-only ID', () => {
      expect(() => {
        new MultipleChoiceQuestion(
          '   ',
          'What is the output?',
          validOptions,
          [0],
          'Explanation',
          'basics',
          'easy'
        );
      }).toThrow('Question ID cannot be empty');
    });

    it('should throw error for empty text', () => {
      expect(() => {
        new MultipleChoiceQuestion(
          'q1',
          '',
          validOptions,
          [0],
          'Explanation',
          'basics',
          'easy'
        );
      }).toThrow('Question text cannot be empty');
    });

    it('should throw error for empty options array', () => {
      expect(() => {
        new MultipleChoiceQuestion(
          'q1',
          'What is the output?',
          [],
          [0],
          'Explanation',
          'basics',
          'easy'
        );
      }).toThrow('Question must have at least one option');
    });

    it('should throw error for empty correct answers array', () => {
      expect(() => {
        new MultipleChoiceQuestion(
          'q1',
          'What is the output?',
          validOptions,
          [],
          'Explanation',
          'basics',
          'easy'
        );
      }).toThrow('Question must have at least one correct answer');
    });

    it('should throw error for empty explanation', () => {
      expect(() => {
        new MultipleChoiceQuestion(
          'q1',
          'What is the output?',
          validOptions,
          [0],
          '',
          'basics',
          'easy'
        );
      }).toThrow('Question explanation cannot be empty');
    });

    it('should throw error for empty category', () => {
      expect(() => {
        new MultipleChoiceQuestion(
          'q1',
          'What is the output?',
          validOptions,
          [0],
          'Explanation',
          '',
          'easy'
        );
      }).toThrow('Question category cannot be empty');
    });

    it('should throw error for out-of-bounds correct answer index', () => {
      expect(() => {
        new MultipleChoiceQuestion(
          'q1',
          'What is the output?',
          validOptions,
          [4], // Index 4 is out of bounds for 4 options (0-3)
          'Explanation',
          'basics',
          'easy'
        );
      }).toThrow('Correct answer index 4 is out of bounds for options array');
    });

    it('should throw error for negative correct answer index', () => {
      expect(() => {
        new MultipleChoiceQuestion(
          'q1',
          'What is the output?',
          validOptions,
          [-1],
          'Explanation',
          'basics',
          'easy'
        );
      }).toThrow('Correct answer index -1 is out of bounds for options array');
    });

    it('should remove duplicate correct answers', () => {
      const question = new MultipleChoiceQuestion(
        'q1',
        'What is the output?',
        validOptions,
        [0, 1, 0, 2, 1], // Duplicates: 0 and 1 appear twice
        'Explanation',
        'basics',
        'easy'
      );

      const correctAnswers = question.getCorrectAnswers();
      expect(correctAnswers).toHaveLength(3);
      expect(correctAnswers).toContain(0);
      expect(correctAnswers).toContain(1);
      expect(correctAnswers).toContain(2);
    });

    it('should trim whitespace from string parameters', () => {
      const question = new MultipleChoiceQuestion(
        '  q1  ',
        '  What is the output?  ',
        validOptions,
        [0],
        '  Explanation  ',
        '  basics  ',
        'easy'
      );

      expect(question.id).toBe('q1');
      expect(question.text).toBe('What is the output?');
      expect(question.explanation).toBe('Explanation');
      expect(question.category).toBe('basics');
    });
  });

  describe('getters', () => {
    let question: MultipleChoiceQuestion;

    beforeEach(() => {
      question = new MultipleChoiceQuestion(
        'q1',
        'What is the output?',
        validOptions,
        [0, 2],
        'The answer is A and C because...',
        'basics',
        'medium',
        validCodeExample
      );
    });

    it('should return immutable options array', () => {
      const options1 = question.options;
      const options2 = question.options;

      expect(options1).not.toBe(options2); // Different array instances
      expect(options1).toEqual(options2); // Same content
    });

    it('should return correct difficulty', () => {
      expect(question.difficulty).toBe('medium');
    });

    it('should return code example when present', () => {
      expect(question.codeExample).toBeDefined();
      expect(question.codeExample?.language).toBe('csharp');
    });
  });

  describe('getCorrectAnswers', () => {
    it('should return immutable correct answers array', () => {
      const question = new MultipleChoiceQuestion(
        'q1',
        'What is the output?',
        validOptions,
        [0, 2],
        'Explanation',
        'basics',
        'easy'
      );

      const answers1 = question.getCorrectAnswers();
      const answers2 = question.getCorrectAnswers();

      expect(answers1).not.toBe(answers2); // Different array instances
      expect(answers1).toEqual(answers2); // Same content
    });

    it('should return correct answer indices', () => {
      const question = new MultipleChoiceQuestion(
        'q1',
        'What is the output?',
        validOptions,
        [1, 3],
        'Explanation',
        'basics',
        'easy'
      );

      expect(question.getCorrectAnswers()).toEqual([1, 3]);
    });
  });

  describe('hasMultipleCorrectAnswers', () => {
    it('should return false for single correct answer', () => {
      const question = new MultipleChoiceQuestion(
        'q1',
        'What is the output?',
        validOptions,
        [0],
        'Explanation',
        'basics',
        'easy'
      );

      expect(question.hasMultipleCorrectAnswers()).toBe(false);
    });

    it('should return true for multiple correct answers', () => {
      const question = new MultipleChoiceQuestion(
        'q1',
        'What is the output?',
        validOptions,
        [0, 2],
        'Explanation',
        'basics',
        'easy'
      );

      expect(question.hasMultipleCorrectAnswers()).toBe(true);
    });

    it('should return true for three correct answers', () => {
      const question = new MultipleChoiceQuestion(
        'q1',
        'What is the output?',
        validOptions,
        [0, 1, 3],
        'Explanation',
        'basics',
        'easy'
      );

      expect(question.hasMultipleCorrectAnswers()).toBe(true);
    });
  });
});