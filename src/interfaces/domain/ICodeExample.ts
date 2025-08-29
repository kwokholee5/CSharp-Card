/**
 * Interface representing a code example associated with a question.
 * Provides immutable access to code content and metadata.
 */
export interface ICodeExample {
  /** The source code content */
  readonly code: string;
  
  /** Programming language of the code (e.g., 'csharp', 'javascript') */
  readonly language: string;
  
  /** Optional output or result of executing the code */
  readonly output?: string;
}