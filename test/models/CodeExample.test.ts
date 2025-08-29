import { describe, it, expect } from 'vitest';
import { CodeExample } from '../../src/models/CodeExample';

describe('CodeExample', () => {
  describe('constructor', () => {
    it('should create a valid code example with all parameters', () => {
      const codeExample = new CodeExample(
        'int x = 5;\nConsole.WriteLine(x);',
        'csharp',
        '5'
      );

      expect(codeExample.code).toBe('int x = 5;\nConsole.WriteLine(x);');
      expect(codeExample.language).toBe('csharp');
      expect(codeExample.output).toBe('5');
    });

    it('should create a valid code example without output', () => {
      const codeExample = new CodeExample(
        'int x = 5;',
        'csharp'
      );

      expect(codeExample.code).toBe('int x = 5;');
      expect(codeExample.language).toBe('csharp');
      expect(codeExample.output).toBeUndefined();
    });

    it('should create a valid code example with empty output', () => {
      const codeExample = new CodeExample(
        'int x = 5;',
        'csharp',
        ''
      );

      expect(codeExample.output).toBeUndefined();
    });

    it('should throw error for empty code', () => {
      expect(() => {
        new CodeExample('', 'csharp', '5');
      }).toThrow('Code content cannot be empty');
    });

    it('should throw error for whitespace-only code', () => {
      expect(() => {
        new CodeExample('   ', 'csharp', '5');
      }).toThrow('Code content cannot be empty');
    });

    it('should throw error for empty language', () => {
      expect(() => {
        new CodeExample('int x = 5;', '', '5');
      }).toThrow('Programming language cannot be empty');
    });

    it('should throw error for whitespace-only language', () => {
      expect(() => {
        new CodeExample('int x = 5;', '   ', '5');
      }).toThrow('Programming language cannot be empty');
    });

    it('should trim whitespace from parameters', () => {
      const codeExample = new CodeExample(
        '  int x = 5;  ',
        '  CSharp  ',
        '  5  '
      );

      expect(codeExample.code).toBe('int x = 5;');
      expect(codeExample.language).toBe('csharp'); // Should be lowercase
      expect(codeExample.output).toBe('5');
    });

    it('should convert language to lowercase', () => {
      const codeExample = new CodeExample(
        'int x = 5;',
        'CSHARP',
        '5'
      );

      expect(codeExample.language).toBe('csharp');
    });

    it('should handle mixed case language', () => {
      const codeExample = new CodeExample(
        'console.log("hello");',
        'JavaScript',
        'hello'
      );

      expect(codeExample.language).toBe('javascript');
    });
  });

  describe('getters', () => {
    it('should return immutable properties', () => {
      const codeExample = new CodeExample(
        'int x = 5;\nConsole.WriteLine(x);',
        'csharp',
        '5'
      );

      expect(codeExample.code).toBe('int x = 5;\nConsole.WriteLine(x);');
      expect(codeExample.language).toBe('csharp');
      expect(codeExample.output).toBe('5');
    });

    it('should return undefined for missing output', () => {
      const codeExample = new CodeExample(
        'int x = 5;',
        'csharp'
      );

      expect(codeExample.output).toBeUndefined();
    });
  });

  describe('toString', () => {
    it('should format code example with output', () => {
      const codeExample = new CodeExample(
        'int x = 5;\nConsole.WriteLine(x);',
        'csharp',
        '5'
      );

      const expected = '[CSHARP]\nint x = 5;\nConsole.WriteLine(x);\n\nOutput:\n5';
      expect(codeExample.toString()).toBe(expected);
    });

    it('should format code example without output', () => {
      const codeExample = new CodeExample(
        'int x = 5;',
        'csharp'
      );

      const expected = '[CSHARP]\nint x = 5;';
      expect(codeExample.toString()).toBe(expected);
    });

    it('should format code example with empty output', () => {
      const codeExample = new CodeExample(
        'int x = 5;',
        'csharp',
        ''
      );

      const expected = '[CSHARP]\nint x = 5;';
      expect(codeExample.toString()).toBe(expected);
    });

    it('should uppercase language in formatted output', () => {
      const codeExample = new CodeExample(
        'console.log("test");',
        'javascript',
        'test'
      );

      expect(codeExample.toString()).toContain('[JAVASCRIPT]');
    });
  });

  describe('hasOutput', () => {
    it('should return true when output is present', () => {
      const codeExample = new CodeExample(
        'int x = 5;\nConsole.WriteLine(x);',
        'csharp',
        '5'
      );

      expect(codeExample.hasOutput()).toBe(true);
    });

    it('should return false when output is undefined', () => {
      const codeExample = new CodeExample(
        'int x = 5;',
        'csharp'
      );

      expect(codeExample.hasOutput()).toBe(false);
    });

    it('should return false when output is empty string', () => {
      const codeExample = new CodeExample(
        'int x = 5;',
        'csharp',
        ''
      );

      expect(codeExample.hasOutput()).toBe(false);
    });

    it('should return false when output is whitespace only', () => {
      const codeExample = new CodeExample(
        'int x = 5;',
        'csharp',
        '   '
      );

      expect(codeExample.hasOutput()).toBe(false);
    });

    it('should return true when output has meaningful content', () => {
      const codeExample = new CodeExample(
        'Console.WriteLine("Hello World");',
        'csharp',
        'Hello World'
      );

      expect(codeExample.hasOutput()).toBe(true);
    });
  });
});