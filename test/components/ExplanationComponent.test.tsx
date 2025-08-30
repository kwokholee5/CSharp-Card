import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExplanationComponent, type ExplanationComponentProps } from '../../src/components/ExplanationComponent';
import type { IQuestion } from '../../src/interfaces/domain/IQuestion';
import type { IAnswerResult } from '../../src/interfaces/domain/types';

// Mock CSS import
vi.mock('../../src/components/ExplanationComponent.css', () => ({}));

/**
 * Helper function to create a mock question for testing
 */
const createMockQuestion = (overrides: Partial<IQuestion> = {}): IQuestion => ({
  id: 'test-question-1',
  text: 'What is the correct way to declare a variable in C#?',
  options: [
    { id: 'opt-1', text: 'var x = 10;' },
    { id: 'opt-2', text: 'int x = 10;' },
    { id: 'opt-3', text: 'x = 10;' },
    { id: 'opt-4', text: 'declare x = 10;' }
  ],
  category: 'Variables',
  difficulty: 'easy' as const,
  explanation: 'Both var and int are correct ways to declare variables in C#. The var keyword uses type inference, while int explicitly specifies the type.',
  getCorrectAnswers: vi.fn(() => [0, 1]),
  hasMultipleCorrectAnswers: vi.fn(() => true),
  codeExample: {
    code: 'int x = 10;\nvar y = 20;',
    language: 'csharp'
  },
  ...overrides
});

/**
 * Helper function to create a mock answer result for testing
 */
const createMockAnswerResult = (overrides: Partial<IAnswerResult> = {}): IAnswerResult => ({
  isCorrect: true,
  correctAnswers: [0, 1],
  explanation: 'Both var and int are correct ways to declare variables in C#. The var keyword uses type inference, while int explicitly specifies the type.',
  selectedAnswers: [0, 1],
  ...overrides
});

/**
 * Helper function to create default props for ExplanationComponent
 */
const createDefaultProps = (overrides: Partial<ExplanationComponentProps> = {}): ExplanationComponentProps => ({
  question: createMockQuestion(),
  answerResult: createMockAnswerResult(),
  onRedoQuestion: vi.fn(),
  onNextQuestion: vi.fn(),
  onError: vi.fn(),
  ...overrides
});

describe('ExplanationComponent', () => {
  let mockOnRedoQuestion: ReturnType<typeof vi.fn>;
  let mockOnNextQuestion: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnRedoQuestion = vi.fn();
    mockOnNextQuestion = vi.fn();
    mockOnError = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with correct structure', () => {
      const props = createDefaultProps({
        onRedoQuestion: mockOnRedoQuestion,
        onNextQuestion: mockOnNextQuestion,
        onError: mockOnError
      });

      render(<ExplanationComponent {...props} />);

      // Check main container exists
      const container = document.querySelector('.explanation-component');
      expect(container).toBeInTheDocument();
      
      // Check result header
      expect(screen.getByText('Correct!')).toBeInTheDocument();
      expect(screen.getByText('Well done! Your answer is correct.')).toBeInTheDocument();
      
      // Check navigation buttons
      expect(screen.getByRole('button', { name: /redo this question/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /move to next question/i })).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const props = createDefaultProps({ className: 'custom-class' });
      const { container } = render(<ExplanationComponent {...props} />);
      
      expect(container.firstChild).toHaveClass('explanation-component', 'custom-class');
    });

    it('should render correct result header for correct answer', () => {
      const props = createDefaultProps({
        answerResult: createMockAnswerResult({ isCorrect: true })
      });

      render(<ExplanationComponent {...props} />);

      expect(screen.getByText('Correct!')).toBeInTheDocument();
      expect(screen.getByText('Well done! Your answer is correct.')).toBeInTheDocument();
      // Check for the checkmark in the header specifically
      const header = document.querySelector('.explanation-result-icon');
      expect(header).toHaveTextContent('✓');
    });

    it('should render incorrect result header for incorrect answer', () => {
      const props = createDefaultProps({
        answerResult: createMockAnswerResult({ isCorrect: false })
      });

      render(<ExplanationComponent {...props} />);

      expect(screen.getByText('Incorrect')).toBeInTheDocument();
      expect(screen.getByText('Don\'t worry, let\'s learn from this.')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
    });
  });

  describe('Answer Options Display', () => {
    it('should display all answer options with correct indicators', () => {
      const question = createMockQuestion();
      const props = createDefaultProps({ question });

      render(<ExplanationComponent {...props} />);

      // Check that all options are displayed
      question.options.forEach((option, index) => {
        expect(screen.getByText(option.text)).toBeInTheDocument();
        expect(screen.getByText(String.fromCharCode(65 + index))).toBeInTheDocument(); // A, B, C, D
      });
    });

    it('should highlight correct answers properly', () => {
      const question = createMockQuestion();
      const answerResult = createMockAnswerResult({
        correctAnswers: [0, 1],
        selectedAnswers: [0, 1],
        isCorrect: true
      });
      const props = createDefaultProps({ question, answerResult });

      render(<ExplanationComponent {...props} />);

      // Check for correct answer badges
      expect(screen.getAllByText('Your Correct Selection')).toHaveLength(2);
    });

    it('should show incorrect selections properly', () => {
      const question = createMockQuestion();
      const answerResult = createMockAnswerResult({
        correctAnswers: [0, 1],
        selectedAnswers: [2, 3],
        isCorrect: false
      });
      const props = createDefaultProps({ question, answerResult });

      render(<ExplanationComponent {...props} />);

      // Check for incorrect selection badges
      expect(screen.getAllByText('Your Selection')).toHaveLength(2);
      // Check for correct answer badges
      expect(screen.getAllByText('Correct Answer')).toHaveLength(2);
    });

    it('should show mixed correct and incorrect selections', () => {
      const question = createMockQuestion();
      const answerResult = createMockAnswerResult({
        correctAnswers: [0, 1],
        selectedAnswers: [0, 2], // One correct, one incorrect
        isCorrect: false
      });
      const props = createDefaultProps({ question, answerResult });

      render(<ExplanationComponent {...props} />);

      // Should show one correct selection and one incorrect selection
      expect(screen.getByText('Your Correct Selection')).toBeInTheDocument();
      expect(screen.getByText('Your Selection')).toBeInTheDocument();
      expect(screen.getAllByText('Correct Answer')).toHaveLength(2); // For both correct answers
    });
  });

  describe('Summary Statistics', () => {
    it('should display correct summary statistics', () => {
      const question = createMockQuestion();
      const answerResult = createMockAnswerResult({
        correctAnswers: [0, 1],
        selectedAnswers: [0, 1],
        isCorrect: true
      });
      const props = createDefaultProps({ question, answerResult });

      render(<ExplanationComponent {...props} />);

      expect(screen.getByText('2 of 4')).toBeInTheDocument(); // Correct answers
      expect(screen.getByText('2 options')).toBeInTheDocument(); // Your selection
      expect(screen.getByText('2 of 2')).toBeInTheDocument(); // Correctly selected
    });

    it('should handle single selection correctly', () => {
      const question = createMockQuestion();
      const answerResult = createMockAnswerResult({
        correctAnswers: [1],
        selectedAnswers: [1],
        isCorrect: true
      });
      const props = createDefaultProps({ question, answerResult });

      render(<ExplanationComponent {...props} />);

      expect(screen.getByText('1 of 4')).toBeInTheDocument(); // Correct answers
      expect(screen.getByText('1 option')).toBeInTheDocument(); // Your selection (singular)
      expect(screen.getByText('1 of 1')).toBeInTheDocument(); // Correctly selected
    });
  });

  describe('Explanation Display', () => {
    it('should display the explanation text', () => {
      const answerResult = createMockAnswerResult({
        explanation: 'This is a detailed explanation of the correct answer.'
      });
      const props = createDefaultProps({ answerResult });

      render(<ExplanationComponent {...props} />);

      expect(screen.getByText('Explanation')).toBeInTheDocument();
      expect(screen.getByText('This is a detailed explanation of the correct answer.')).toBeInTheDocument();
    });

    it('should handle multiline explanations', () => {
      const answerResult = createMockAnswerResult({
        explanation: 'Line 1\nLine 2\nLine 3'
      });
      const props = createDefaultProps({ answerResult });

      render(<ExplanationComponent {...props} />);

      // Check that the explanation text element contains the multiline content
      // Note: textContent normalizes whitespace, so we check for the presence of all lines
      const explanationText = document.querySelector('.explanation-text');
      expect(explanationText).toHaveTextContent('Line 1 Line 2 Line 3');
    });
  });

  describe('Navigation Buttons', () => {
    it('should render both navigation buttons when callbacks are provided', () => {
      const props = createDefaultProps({
        onRedoQuestion: mockOnRedoQuestion,
        onNextQuestion: mockOnNextQuestion
      });

      render(<ExplanationComponent {...props} />);

      const redoButton = screen.getByRole('button', { name: /redo this question/i });
      const nextButton = screen.getByRole('button', { name: /move to next question/i });

      expect(redoButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
      expect(redoButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it('should disable redo button when callback is not provided', () => {
      const props = createDefaultProps({
        onRedoQuestion: undefined,
        onNextQuestion: mockOnNextQuestion
      });

      render(<ExplanationComponent {...props} />);

      const redoButton = screen.getByRole('button', { name: /redo this question/i });
      expect(redoButton).toBeDisabled();
    });

    it('should disable next button when callback is not provided', () => {
      const props = createDefaultProps({
        onRedoQuestion: mockOnRedoQuestion,
        onNextQuestion: undefined
      });

      render(<ExplanationComponent {...props} />);

      const nextButton = screen.getByRole('button', { name: /move to next question/i });
      expect(nextButton).toBeDisabled();
    });

    it('should call onRedoQuestion when redo button is clicked', () => {
      const props = createDefaultProps({
        onRedoQuestion: mockOnRedoQuestion,
        onNextQuestion: mockOnNextQuestion
      });

      render(<ExplanationComponent {...props} />);

      const redoButton = screen.getByRole('button', { name: /redo this question/i });
      fireEvent.click(redoButton);

      expect(mockOnRedoQuestion).toHaveBeenCalledTimes(1);
      expect(mockOnNextQuestion).not.toHaveBeenCalled();
    });

    it('should call onNextQuestion when next button is clicked', () => {
      const props = createDefaultProps({
        onRedoQuestion: mockOnRedoQuestion,
        onNextQuestion: mockOnNextQuestion
      });

      render(<ExplanationComponent {...props} />);

      const nextButton = screen.getByRole('button', { name: /move to next question/i });
      fireEvent.click(nextButton);

      expect(mockOnNextQuestion).toHaveBeenCalledTimes(1);
      expect(mockOnRedoQuestion).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in answer options rendering gracefully', () => {
      const question = createMockQuestion();
      const answerResult = createMockAnswerResult();
      
      // Mock the answerResult.correctAnswers to cause an error when accessed
      Object.defineProperty(answerResult, 'correctAnswers', {
        get: () => {
          throw new Error('Test error');
        }
      });

      const props = createDefaultProps({
        question,
        answerResult,
        onError: mockOnError
      });

      render(<ExplanationComponent {...props} />);

      // The error handling should still render the component but with error state
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      // The component should still render the main structure
      expect(screen.getByText('Answer Options')).toBeInTheDocument();
      expect(screen.getByText('Unable to display answer options')).toBeInTheDocument();
    });

    it('should handle errors in summary rendering gracefully', () => {
      const question = createMockQuestion();
      // Mock options to be undefined to cause an error
      Object.defineProperty(question, 'options', {
        get: () => {
          throw new Error('Test error');
        }
      });

      const props = createDefaultProps({
        question,
        onError: mockOnError
      });

      render(<ExplanationComponent {...props} />);

      expect(screen.getByText('Unable to display summary')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not call onError when not provided', () => {
      const question = createMockQuestion();
      question.getCorrectAnswers = vi.fn(() => {
        throw new Error('Test error');
      });

      const props = createDefaultProps({
        question,
        onError: undefined
      });

      // Should not throw an error even when onError is not provided
      expect(() => render(<ExplanationComponent {...props} />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on navigation buttons', () => {
      const props = createDefaultProps({
        onRedoQuestion: mockOnRedoQuestion,
        onNextQuestion: mockOnNextQuestion
      });

      render(<ExplanationComponent {...props} />);

      expect(screen.getByRole('button', { name: /redo this question/i })).toHaveAttribute('aria-label', 'Redo this question');
      expect(screen.getByRole('button', { name: /move to next question/i })).toHaveAttribute('aria-label', 'Move to next question');
    });

    it('should be keyboard navigable', () => {
      const props = createDefaultProps({
        onRedoQuestion: mockOnRedoQuestion,
        onNextQuestion: mockOnNextQuestion
      });

      render(<ExplanationComponent {...props} />);

      const redoButton = screen.getByRole('button', { name: /redo this question/i });
      const nextButton = screen.getByRole('button', { name: /move to next question/i });

      // Focus should work on buttons
      redoButton.focus();
      expect(document.activeElement).toBe(redoButton);

      nextButton.focus();
      expect(document.activeElement).toBe(nextButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      const question = createMockQuestion({
        options: []
      });
      const answerResult = createMockAnswerResult({
        correctAnswers: [],
        selectedAnswers: []
      });
      const props = createDefaultProps({ question, answerResult });

      render(<ExplanationComponent {...props} />);

      // Should still render the component structure
      expect(screen.getByText('Answer Options')).toBeInTheDocument();
      // Use getAllByText since there are multiple "0 of 0" texts
      expect(screen.getAllByText('0 of 0')).toHaveLength(2); // Summary stats
    });

    it('should handle no selected answers', () => {
      const question = createMockQuestion();
      const answerResult = createMockAnswerResult({
        correctAnswers: [0, 1],
        selectedAnswers: [],
        isCorrect: false
      });
      const props = createDefaultProps({ question, answerResult });

      render(<ExplanationComponent {...props} />);

      expect(screen.getByText('0 options')).toBeInTheDocument(); // Your selection
      expect(screen.getByText('0 of 2')).toBeInTheDocument(); // Correctly selected
    });

    it('should handle single correct answer', () => {
      const question = createMockQuestion();
      question.hasMultipleCorrectAnswers = vi.fn(() => false);
      const answerResult = createMockAnswerResult({
        correctAnswers: [1],
        selectedAnswers: [1],
        isCorrect: true
      });
      const props = createDefaultProps({ question, answerResult });

      render(<ExplanationComponent {...props} />);

      expect(screen.getByText('1 of 4')).toBeInTheDocument(); // Correct answers
      expect(screen.getByText('1 option')).toBeInTheDocument(); // Your selection (singular)
    });
  });
});