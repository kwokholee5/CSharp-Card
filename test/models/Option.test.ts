import { describe, it, expect } from 'vitest';
import { Option } from '../../src/models/Option';

describe('Option', () => {
  describe('constructor', () => {
    it('should create a valid option with all parameters', () => {
      const option = new Option(
        'a',
        'This is option A',
        'Explanation for option A'
      );

      expect(option.id).toBe('a');
      expect(option.text).toBe('This is option A');
      expect(option.explanation).toBe('Explanation for option A');
    });

    it('should create a valid option without explanation', () => {
      const option = new Option('b', 'This is option B');

      expect(option.id).toBe('b');
      expect(option.text).toBe('This is option B');
      expect(option.explanation).toBeUndefined();
    });

    it('should create a valid option with empty explanation', () => {
      const option = new Option('c', 'This is option C', '');

      expect(option.id).toBe('c');
      expect(option.text).toBe('This is option C');
      expect(option.explanation).toBeUndefined();
    });

    it('should throw error for empty ID', () => {
      expect(() => {
        new Option('', 'This is option A');
      }).toThrow('Option ID cannot be empty');
    });

    it('should throw error for whitespace-only ID', () => {
      expect(() => {
        new Option('   ', 'This is option A');
      }).toThrow('Option ID cannot be empty');
    });

    it('should throw error for empty text', () => {
      expect(() => {
        new Option('a', '');
      }).toThrow('Option text cannot be empty');
    });

    it('should throw error for whitespace-only text', () => {
      expect(() => {
        new Option('a', '   ');
      }).toThrow('Option text cannot be empty');
    });

    it('should trim whitespace from parameters', () => {
      const option = new Option(
        '  a  ',
        '  This is option A  ',
        '  Explanation for A  '
      );

      expect(option.id).toBe('a');
      expect(option.text).toBe('This is option A');
      expect(option.explanation).toBe('Explanation for A');
    });

    it('should handle whitespace-only explanation as undefined', () => {
      const option = new Option('a', 'This is option A', '   ');

      expect(option.explanation).toBeUndefined();
    });
  });

  describe('getters', () => {
    it('should return immutable properties', () => {
      const option = new Option(
        'a',
        'This is option A',
        'Explanation for A'
      );

      expect(option.id).toBe('a');
      expect(option.text).toBe('This is option A');
      expect(option.explanation).toBe('Explanation for A');
    });

    it('should return undefined for missing explanation', () => {
      const option = new Option('a', 'This is option A');

      expect(option.explanation).toBeUndefined();
    });
  });

  describe('hasExplanation', () => {
    it('should return true when explanation is present', () => {
      const option = new Option(
        'a',
        'This is option A',
        'Explanation for A'
      );

      expect(option.hasExplanation()).toBe(true);
    });

    it('should return false when explanation is undefined', () => {
      const option = new Option('a', 'This is option A');

      expect(option.hasExplanation()).toBe(false);
    });

    it('should return false when explanation is empty string', () => {
      const option = new Option('a', 'This is option A', '');

      expect(option.hasExplanation()).toBe(false);
    });

    it('should return false when explanation is whitespace only', () => {
      const option = new Option('a', 'This is option A', '   ');

      expect(option.hasExplanation()).toBe(false);
    });

    it('should return true when explanation has meaningful content', () => {
      const option = new Option(
        'a',
        'This is option A',
        'This option is correct because...'
      );

      expect(option.hasExplanation()).toBe(true);
    });
  });

  describe('toString', () => {
    it('should format option with explanation', () => {
      const option = new Option(
        'a',
        'This is option A',
        'Explanation for A'
      );

      const expected = 'a: This is option A (Explanation for A)';
      expect(option.toString()).toBe(expected);
    });

    it('should format option without explanation', () => {
      const option = new Option('b', 'This is option B');

      const expected = 'b: This is option B';
      expect(option.toString()).toBe(expected);
    });

    it('should format option with empty explanation', () => {
      const option = new Option('c', 'This is option C', '');

      const expected = 'c: This is option C';
      expect(option.toString()).toBe(expected);
    });

    it('should handle special characters in text', () => {
      const option = new Option(
        '1',
        'Option with "quotes" and (parentheses)',
        'Explanation with special chars: @#$%'
      );

      const expected = '1: Option with "quotes" and (parentheses) (Explanation with special chars: @#$%)';
      expect(option.toString()).toBe(expected);
    });
  });

  describe('equals', () => {
    it('should return true for identical options', () => {
      const option1 = new Option(
        'a',
        'This is option A',
        'Explanation for A'
      );
      const option2 = new Option(
        'a',
        'This is option A',
        'Explanation for A'
      );

      expect(option1.equals(option2)).toBe(true);
    });

    it('should return true for options without explanations', () => {
      const option1 = new Option('a', 'This is option A');
      const option2 = new Option('a', 'This is option A');

      expect(option1.equals(option2)).toBe(true);
    });

    it('should return false for different IDs', () => {
      const option1 = new Option('a', 'This is option A');
      const option2 = new Option('b', 'This is option A');

      expect(option1.equals(option2)).toBe(false);
    });

    it('should return false for different text', () => {
      const option1 = new Option('a', 'This is option A');
      const option2 = new Option('a', 'This is option B');

      expect(option1.equals(option2)).toBe(false);
    });

    it('should return false for different explanations', () => {
      const option1 = new Option('a', 'This is option A', 'Explanation 1');
      const option2 = new Option('a', 'This is option A', 'Explanation 2');

      expect(option1.equals(option2)).toBe(false);
    });

    it('should return false when one has explanation and other does not', () => {
      const option1 = new Option('a', 'This is option A', 'Explanation');
      const option2 = new Option('a', 'This is option A');

      expect(option1.equals(option2)).toBe(false);
    });

    it('should handle comparison with interface implementation', () => {
      const option1 = new Option('a', 'This is option A');
      const option2 = {
        id: 'a',
        text: 'This is option A',
        explanation: undefined
      };

      expect(option1.equals(option2)).toBe(true);
    });

    it('should be case sensitive for all fields', () => {
      const option1 = new Option('A', 'This is option A', 'Explanation');
      const option2 = new Option('a', 'this is option a', 'explanation');

      expect(option1.equals(option2)).toBe(false);
    });
  });
});