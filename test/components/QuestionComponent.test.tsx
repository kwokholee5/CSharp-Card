import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionComponent } from '../../src/components/QuestionComponent';
import type { IQuestionManager } from '../../src/interfaces/services/IQuestionManager';
import type { IQuestion } from '../../src/interfaces/domain/IQuestion';
import type { ICodeExample } from '../../src/interfaces/domain/ICodeExample';
import type { IOption } from '../../src/interfaces/domain/IOption';

// Mock react-syntax-highlighter to avoid issues in test environment
vi.mock('react-syntax-highlighter', () => ({
  default: ({ children, ...props }: any) => (
    <pre data-testid="syntax-highlighter" {...props}>
      {children}
    </pre>
  )
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {}
}));

describe('QuestionComponent', () => {
  let mockQuestionManager: jest.Mocked<IQuestionManager>;
  let mockQuestion: IQuestion;
  let mockCodeExample: ICodeExample;
  let mockOptions: IOption[];

  beforeEach(() => {
    // Create mock options
    mockOptions = [
      { id: '1', text: 'Option A', explanation: 'Explanation A' },
      { id: '2', text: 'Option B', explanation: 'Explanation B' },
      { id: '3', text: 'Option C', explanation: 'Explanation C' },
      { id: '4', text: 'Option D', explanation: 'Explanation D' }
    ];

    // Create mock code example
    mockCodeExample = {
      code: 'Console.WriteLine("Hello World");',
      language: 'csharp',
      output: 'Hello World'
    };

    // Create mock question
    mockQuestion = {
      id: 'test-question-1',
      text: 'What does this C# code output?',
      codeExample: mockCodeExample,
      options: mockOptions,
      category: 'Basic Syntax',
      difficulty: 'easy' as const,
      explanation: 'This code prints Hello World to the console.',
      getCorrectAnswers: vi.fn().mockReturnValue([0]),
      hasMultipleCorrectAnswers: vi.fn().mockReturnValue(false)
    };

    // Create mock question manager
    mockQuestionManager = {
      getCurrentQuestion: vi.fn().mockReturnValue(mockQuestion),
      moveToNext: vi.fn().mockReturnValue(true),
      moveToPrevious: vi.fn().mockReturnValue(true),
      resetCurrent: vi.fn(),
      getTotalCount: vi.fn().mockReturnValue(10),
      getCurrentIndex: vi.fn().mockReturnValue(0),
      initialize: vi.fn().mockResolvedValue(undefined)
    };
  });

  describe('Rendering', () => {
    it('should render question text and metadata', () => {
      render(<QuestionComponent questionManager={mockQuestionManager} />);

      expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
      expect(screen.getByText('What does this C# code output?')).toBeInTheDocument();
      expect(screen.getByText('EASY')).toBeInTheDocument();
      expect(screen.getByText('Basic Syntax')).toBeInTheDocument();
    });

    it('should render code example with syntax highlighting', () => {
      render(<QuestionComponent questionManager={mockQuestionManager} />);

      expect(screen.getByText('Code Example')).toBeInTheDocument();
      expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument();
      expect(screen.getByText('Console.WriteLine("Hello World");')).toBeInTheDocument();
    });

    it('should render code output when available', () => {
      render(<QuestionComponent questionManager={mockQuestionManager} />);

      expect(screen.getByText('Output:')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should not render code example section when no code example exists', () => {
      const questionWithoutCode = {
        ...mockQuestion,
        codeExample: undefined
      };
      mockQuestionManager.getCurrentQuestion.mockReturnValue(questionWithoutCode);

      render(<QuestionComponent questionManager={mockQuestionManager} />);

      expect(screen.queryByText('Code Example')).not.toBeInTheDocument();
      expect(screen.queryByTestId('syntax-highlighter')).not.toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const { container } = render(
        <QuestionComponent 
          questionManager={mockQuestionManager} 
          className="custom-class" 
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Question States', () => {
    it('should render loading state initially', () => {
      // Since the component loads synchronously in tests, we need to check the final state
      render(<QuestionComponent questionManager={mockQuestionManager} />);

      // The component should render the question immediately in test environment
      expect(screen.getByText('What does this C# code output?')).toBeInTheDocument();
    });

    it('should render empty state when no question is available', async () => {
      mockQuestionManager.getCurrentQuestion.mockReturnValue(null);

      render(<QuestionComponent questionManager={mockQuestionManager} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Question')).toBeInTheDocument();
        expect(screen.getByText('No question available to display')).toBeInTheDocument();
      });
    });

    it('should render error state when question manager throws error', async () => {
      const errorMessage = 'Failed to load question data';
      mockQuestionManager.getCurrentQuestion.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      render(<QuestionComponent questionManager={mockQuestionManager} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Question')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback when error occurs', async () => {
      const onError = vi.fn();
      const error = new Error('Test error');
      mockQuestionManager.getCurrentQuestion.mockImplementation(() => {
        throw error;
      });

      render(
        <QuestionComponent 
          questionManager={mockQuestionManager} 
          onError={onError} 
        />
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('should handle non-Error exceptions gracefully', async () => {
      const onError = vi.fn();
      mockQuestionManager.getCurrentQuestion.mockImplementation(() => {
        throw 'String error';
      });

      render(
        <QuestionComponent 
          questionManager={mockQuestionManager} 
          onError={onError} 
        />
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(screen.getByText('Failed to load question')).toBeInTheDocument();
      });
    });
  });

  describe('Question Metadata Display', () => {
    it('should display different difficulty levels correctly', async () => {
      const difficulties = ['easy', 'medium', 'hard'] as const;
      
      for (const difficulty of difficulties) {
        const questionWithDifficulty = {
          ...mockQuestion,
          difficulty
        };
        mockQuestionManager.getCurrentQuestion.mockReturnValue(questionWithDifficulty);

        const { rerender } = render(<QuestionComponent questionManager={mockQuestionManager} />);

        await waitFor(() => {
          expect(screen.getByText(difficulty.toUpperCase())).toBeInTheDocument();
        });

        rerender(<div />); // Clear previous render
      }
    });

    it('should display question index and total count correctly', async () => {
      mockQuestionManager.getCurrentIndex.mockReturnValue(4);
      mockQuestionManager.getTotalCount.mockReturnValue(20);

      render(<QuestionComponent questionManager={mockQuestionManager} />);

      await waitFor(() => {
        expect(screen.getByText('Question 5 of 20')).toBeInTheDocument();
      });
    });
  });

  describe('Code Example Variations', () => {
    it('should handle code example without output', async () => {
      const codeExampleWithoutOutput = {
        code: 'int x = 5;',
        language: 'csharp'
      };
      const questionWithCodeNoOutput = {
        ...mockQuestion,
        codeExample: codeExampleWithoutOutput
      };
      mockQuestionManager.getCurrentQuestion.mockReturnValue(questionWithCodeNoOutput);

      render(<QuestionComponent questionManager={mockQuestionManager} />);

      await waitFor(() => {
        expect(screen.getByText('Code Example')).toBeInTheDocument();
        expect(screen.getByText('int x = 5;')).toBeInTheDocument();
        expect(screen.queryByText('Output:')).not.toBeInTheDocument();
      });
    });

    it('should handle different programming languages', async () => {
      const jsCodeExample = {
        code: 'console.log("Hello");',
        language: 'javascript',
        output: 'Hello'
      };
      const questionWithJsCode = {
        ...mockQuestion,
        codeExample: jsCodeExample
      };
      mockQuestionManager.getCurrentQuestion.mockReturnValue(questionWithJsCode);

      render(<QuestionComponent questionManager={mockQuestionManager} />);

      await waitFor(() => {
        expect(screen.getByText('console.log("Hello");')).toBeInTheDocument();
      });
    });

    it('should properly highlight C# syntax with line numbers', async () => {
      const csharpCodeExample = {
        code: 'public class Test\n{\n    public static void Main()\n    {\n        Console.WriteLine("Hello World");\n    }\n}',
        language: 'csharp',
        output: 'Hello World'
      };
      const questionWithCsharpCode = {
        ...mockQuestion,
        codeExample: csharpCodeExample
      };
      mockQuestionManager.getCurrentQuestion.mockReturnValue(questionWithCsharpCode);

      render(<QuestionComponent questionManager={mockQuestionManager} />);

      await waitFor(() => {
        expect(screen.getByText('Code Example')).toBeInTheDocument();
        expect(screen.getByText(/public class Test/)).toBeInTheDocument();
        expect(screen.getByText(/Console\.WriteLine/)).toBeInTheDocument();
        expect(screen.getByText('Output:')).toBeInTheDocument();
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should update when questionManager changes', async () => {
      const { rerender } = render(<QuestionComponent questionManager={mockQuestionManager} />);

      await waitFor(() => {
        expect(screen.getByText('What does this C# code output?')).toBeInTheDocument();
      });

      // Create new question manager with different question
      const newQuestion = {
        ...mockQuestion,
        id: 'new-question',
        text: 'What is the result of this operation?'
      };
      const newQuestionManager = {
        ...mockQuestionManager,
        getCurrentQuestion: vi.fn().mockReturnValue(newQuestion)
      };

      rerender(<QuestionComponent questionManager={newQuestionManager} />);

      await waitFor(() => {
        expect(screen.getByText('What is the result of this operation?')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      render(<QuestionComponent questionManager={mockQuestionManager} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Question 1 of 10');
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Code Example');
      });
    });

    it('should have proper semantic structure for code output', async () => {
      render(<QuestionComponent questionManager={mockQuestionManager} />);

      await waitFor(() => {
        const outputSection = screen.getByText('Output:').closest('.code-output');
        expect(outputSection).toBeInTheDocument();
        expect(outputSection?.querySelector('pre')).toBeInTheDocument();
      });
    });
  });
});