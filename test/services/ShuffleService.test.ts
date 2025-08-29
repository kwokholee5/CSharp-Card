import { describe, it, expect, beforeEach } from 'vitest';
import { ShuffleService } from '../../src/services/ShuffleService';
import { MultipleChoiceQuestion } from '../../src/models/MultipleChoiceQuestion';
import { Option } from '../../src/models/Option';
import { CodeExample } from '../../src/models/CodeExample';
import type { IQuestion } from '../../src/interfaces/domain/IQuestion';
import type { IOption } from '../../src/interfaces/domain/IOption';

describe('ShuffleService', () => {
  let shuffleService: ShuffleService;

  beforeEach(() => {
    shuffleService = new ShuffleService();
  });

  describe('shuffleQuestions', () => {
    it('should return empty array for empty input', () => {
      const result = shuffleService.shuffleQuestions([]);
      expect(result).toEqual([]);
    });

    it('should return same array for single question', () => {
      const question = createTestQuestion('test-1', 'Test question?', ['A', 'B'], [0]);
      const result = shuffleService.shuffleQuestions([question]);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
    });

    it('should shuffle multiple questions', () => {
      const questions = [
        createTestQuestion('test-1', 'Question 1?', ['A', 'B'], [0]),
        createTestQuestion('test-2', 'Question 2?', ['C', 'D'], [1]),
        createTestQuestion('test-3', 'Question 3?', ['E', 'F'], [0])
      ];

      const result = shuffleService.shuffleQuestions(questions);
      
      expect(result).toHaveLength(3);
      expect(result.map(q => q.id).sort()).toEqual(['test-1', 'test-2', 'test-3']);
      
      // Note: This test may occasionally fail due to random chance
      // In practice, with 3 items, there's a 1/6 chance the order remains the same
    });

    it('should not mutate original array', () => {
      const questions = [
        createTestQuestion('test-1', 'Question 1?', ['A', 'B'], [0]),
        createTestQuestion('test-2', 'Question 2?', ['C', 'D'], [1])
      ];
      const originalIds = questions.map(q => q.id);

      shuffleService.shuffleQuestions(questions);
      
      expect(questions.map(q => q.id)).toEqual(originalIds);
    });
  });

  describe('shuffleOptionsWithMapping', () => {
    it('should return empty arrays for empty input', () => {
      const result = shuffleService.shuffleOptionsWithMapping([]);
      
      expect(result.shuffledOptions).toEqual([]);
      expect(result.indexMapping).toEqual([]);
    });

    it('should handle single option correctly', () => {
      const options = [new Option('a', 'Option A')];
      const result = shuffleService.shuffleOptionsWithMapping(options);
      
      expect(result.shuffledOptions).toHaveLength(1);
      expect(result.shuffledOptions[0].id).toBe('a');
      expect(result.indexMapping).toEqual([0]);
    });

    it('should preserve all options after shuffling', () => {
      const options = [
        new Option('a', 'Option A'),
        new Option('b', 'Option B'),
        new Option('c', 'Option C'),
        new Option('d', 'Option D')
      ];

      const result = shuffleService.shuffleOptionsWithMapping(options);
      
      expect(result.shuffledOptions).toHaveLength(4);
      expect(result.indexMapping).toHaveLength(4);
      
      const originalIds = options.map(o => o.id).sort();
      const shuffledIds = result.shuffledOptions.map(o => o.id).sort();
      expect(shuffledIds).toEqual(originalIds);
    });

    it('should create correct index mapping', () => {
      const options = [
        new Option('a', 'Option A'),
        new Option('b', 'Option B')
      ];

      const result = shuffleService.shuffleOptionsWithMapping(options);
      
      // Verify that the mapping correctly maps original positions to new positions
      for (let originalIndex = 0; originalIndex < options.length; originalIndex++) {
        const newIndex = result.indexMapping[originalIndex];
        expect(result.shuffledOptions[newIndex].id).toBe(options[originalIndex].id);
      }
    });
  });

  describe('mapAnswerIndices', () => {
    it('should return empty array for empty input', () => {
      const result = shuffleService.mapAnswerIndices([], [0, 1, 2]);
      expect(result).toEqual([]);
    });

    it('should map single answer index correctly', () => {
      const indexMapping = [2, 0, 1]; // original index 0 -> new index 2, etc.
      const result = shuffleService.mapAnswerIndices([0], indexMapping);
      
      expect(result).toEqual([2]);
    });

    it('should map multiple answer indices correctly', () => {
      const indexMapping = [3, 1, 0, 2]; // 0->3, 1->1, 2->0, 3->2
      const result = shuffleService.mapAnswerIndices([0, 2], indexMapping);
      
      expect(result.sort()).toEqual([0, 3]); // sorted for consistency
    });

    it('should throw error for invalid answer index', () => {
      const indexMapping = [1, 0];
      
      expect(() => {
        shuffleService.mapAnswerIndices([3], indexMapping);
      }).toThrow('Invalid answer index 3 for options array of length 2');
    });

    it('should sort result indices', () => {
      const indexMapping = [3, 1, 0, 2];
      const result = shuffleService.mapAnswerIndices([3, 0], indexMapping);
      
      expect(result).toEqual([2, 3]); // Should be sorted
    });
  });

  describe('shuffleQuestionOptions', () => {
    it('should return same question if single option', () => {
      const question = createTestQuestion(
        'test-1',
        'Test question?',
        ['Single option'],
        [0]
      );

      const result = shuffleService.shuffleQuestionOptions(question);
      
      // Should return the same question instance since shuffling single option has no effect
      expect(result.options).toHaveLength(1);
      expect(result.options[0].text).toBe('Single option');
      expect(result.getCorrectAnswers()).toEqual([0]);
    });

    it('should shuffle options and update correct answers', () => {
      const question = createTestQuestion(
        'test-1', 
        'What is the correct answer?', 
        ['Wrong 1', 'Correct', 'Wrong 2', 'Wrong 3'], 
        [1]
      );

      const result = shuffleService.shuffleQuestionOptions(question);
      
      expect(result.options).toHaveLength(4);
      expect(result.getCorrectAnswers()).toHaveLength(1);
      
      // Verify that the correct answer still points to "Correct" option
      const correctAnswerIndex = result.getCorrectAnswers()[0];
      expect(result.options[correctAnswerIndex].text).toBe('Correct');
    });

    it('should handle multiple correct answers', () => {
      const question = createTestQuestion(
        'test-1',
        'Select all correct answers',
        ['Correct 1', 'Wrong', 'Correct 2', 'Wrong 2'],
        [0, 2]
      );

      const result = shuffleService.shuffleQuestionOptions(question);
      
      expect(result.getCorrectAnswers()).toHaveLength(2);
      
      // Verify both correct answers still point to correct options
      result.getCorrectAnswers().forEach(index => {
        const optionText = result.options[index].text;
        expect(['Correct 1', 'Correct 2']).toContain(optionText);
      });
    });

    it('should preserve question metadata', () => {
      const codeExample = new CodeExample('console.log("test");', 'javascript');
      const question = new MultipleChoiceQuestion(
        'test-1',
        'Test question?',
        [new Option('a', 'Option A'), new Option('b', 'Option B')],
        [0],
        'Test explanation',
        'test-category',
        'Medium',
        codeExample
      );

      const result = shuffleService.shuffleQuestionOptions(question);
      
      expect(result.id).toBe('test-1');
      expect(result.text).toBe('Test question?');
      expect(result.explanation).toBe('Test explanation');
      expect(result.category).toBe('test-category');
      expect(result.difficulty).toBe('Medium');
      expect(result.codeExample).toBe(codeExample);
    });
  });

  describe('integration tests', () => {
    it('should maintain answer correctness through full shuffle cycle', () => {
      const questions = [
        createTestQuestion('q1', 'Question 1?', ['A', 'B', 'C', 'D'], [1, 3]),
        createTestQuestion('q2', 'Question 2?', ['W', 'X', 'Y', 'Z'], [0]),
        createTestQuestion('q3', 'Question 3?', ['P', 'Q', 'R'], [2])
      ];

      // Shuffle questions and their options
      const shuffledQuestions = shuffleService.shuffleQuestions(questions);
      const fullyShuffled = shuffledQuestions.map(q => 
        shuffleService.shuffleQuestionOptions(q)
      );

      // Verify all questions are present
      expect(fullyShuffled).toHaveLength(3);
      const shuffledIds = fullyShuffled.map(q => q.id).sort();
      expect(shuffledIds).toEqual(['q1', 'q2', 'q3']);

      // Verify answer correctness for each question
      fullyShuffled.forEach(question => {
        if (question.id === 'q1') {
          expect(question.getCorrectAnswers()).toHaveLength(2);
          question.getCorrectAnswers().forEach(index => {
            expect(['B', 'D']).toContain(question.options[index].text);
          });
        } else if (question.id === 'q2') {
          expect(question.getCorrectAnswers()).toHaveLength(1);
          expect(question.options[question.getCorrectAnswers()[0]].text).toBe('W');
        } else if (question.id === 'q3') {
          expect(question.getCorrectAnswers()).toHaveLength(1);
          expect(question.options[question.getCorrectAnswers()[0]].text).toBe('R');
        }
      });
    });
  });
});

/**
 * Helper function to create test questions
 */
function createTestQuestion(
  id: string,
  text: string,
  optionTexts: string[],
  correctIndices: number[]
): IQuestion {
  const options = optionTexts.map((text, index) => 
    new Option(String.fromCharCode(97 + index), text)
  );

  return new MultipleChoiceQuestion(
    id,
    text,
    options,
    correctIndices,
    'Test explanation',
    'test',
    'Easy',
    undefined
  );
}
