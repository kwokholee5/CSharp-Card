import { ICodeExample } from '../interfaces/domain';

/**
 * Concrete implementation of ICodeExample representing a code snippet.
 * Provides immutable access to code content and metadata with proper validation.
 */
export class CodeExample implements ICodeExample {
  private readonly _code: string;
  private readonly _language: string;
  private readonly _output?: string;

  constructor(code: string, language: string, output?: string) {
    // Validation
    if (!code || code.trim().length === 0) {
      throw new Error('Code content cannot be empty');
    }
    if (!language || language.trim().length === 0) {
      throw new Error('Programming language cannot be empty');
    }

    this._code = code.trim();
    this._language = language.trim().toLowerCase();
    this._output = output?.trim() || undefined;
  }

  get code(): string {
    return this._code;
  }

  get language(): string {
    return this._language;
  }

  get output(): string | undefined {
    return this._output;
  }

  /**
   * Creates a formatted representation of the code example
   * @returns Formatted string representation
   */
  toString(): string {
    let result = `[${this._language.toUpperCase()}]\n${this._code}`;
    if (this._output) {
      result += `\n\nOutput:\n${this._output}`;
    }
    return result;
  }

  /**
   * Checks if the code example has output
   * @returns True if output is available, false otherwise
   */
  hasOutput(): boolean {
    return this._output !== undefined && this._output.length > 0;
  }
}