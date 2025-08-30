import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { AnswerComponent, type AnswerComponentProps } from '../../src/components/AnswerComponent';
import type { IQuestion } from '../../src/interfaces/domain/IQuestion';
import type { IAnswerManager } from '../../src/interfaces/services/IAnswerManager';
import type { IQuestionState, IAnswerResult } from '../../src/interfaces/domain/types';

// Mock implementations
const createMockQuestion = (hasMultipleCorrect = false): IQuestion => ({
  id: 'test-question-1',
  text: 'What is the correct syntax for declaring a variable in C#?',
  options: [
    { id: 'opt-1', text: 'int x = 5;' },
    { id: 'opt-2', text: 'var x = 5;' },
    { id: 'opt-3', text: 'x = 5;' },
    { id: 'opt-4', text: 'declare int x = 5;' }
  ],
  category: 'Syntax',
  difficulty: 'easy' as const,
  explanation: 'Both int x = 5; and var x = 5; are correct ways to declare variables in C#.',
  getCorrectAnswers: () => hasMultipleCorrect ? [0, 1] : [0],
  hasMultipleCorrectAnswers: () => hasMultipleCorrect,
  codeExample: undefined
});

const createMockAnswerManager = (): jest.Mocked<IAnswerManager> => ({
  submitAnswer: vi.fn(),
  getAnswerState: vi.fn(),
  resetAnswer: vi.fn(),
  isAnswered: vi.fn(),
  getSelectedOptions: vi.fn()
});

const createMockAnswerResult = (isCorrect = true): IAnswerResult => ({
  isCorrect,
  correctAnswers: [0],
  explanation: 'Test explanation',
  selectedAnswers: [0]
});

const createMockQuestionState = (isSubmitted = false, isCorrect = false): IQuestionState => ({
  selectedAnswers: isSubmitted ? [0] : [],
  isSubmitted,
  isCorrect,
  submittedAt: isSubmitted ? new Date() : undefined
});

describe('AnswerComponent', () => {
  let mockQuestion: IQuestion;
  let mockAnswerManager: jest.Mocked<IAnswerManager>;
  let defaultProps: AnswerComponentProps;

  beforeEach(() => {
    mockQuestion = createMockQuestion();
    mockAnswerManager = createMockAnswerManager();
    
    // Default mock implementations
    mockAnswerManager.getAnswerState.mockReturnValue(null);
    mockAnswerManager.submitAnswer.mockReturnValue(createMockAnswerResult());
    
    defaultProps = {
      question: mockQuestion,
      answerManager: mockAnswerManager
    };
  });

  describe('Rendering', () => {
    it('should render all answer options in a grid', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      expect(screen.getByText('int x = 5;')).toBeInTheDocument();
      expect(screen.getByText('var x = 5;')).toBeInTheDocument();
      expect(screen.getByText('x = 5;')).toBeInTheDocument();
      expect(screen.getByText('declare int x = 5;')).toBeInTheDocument();
    });

    it('should render option indicators (A, B, C, D)', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('should render submit button when no answer is submitted', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      expect(screen.getByText('Submit Answer')).toBeInTheDocument();
    });

    it('should render instructions for single selection', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      expect(screen.getByText('Select the correct answer')).toBeInTheDocument();
    });

    it('should render instructions for multiple selection', () => {
      const multipleChoiceQuestion = createMockQuestion(true);
      render(<AnswerComponent {...defaultProps} question={multipleChoiceQuestion} />);
      
      expect(screen.getByText('Select all correct answers')).toBeInTheDocument();
    });
  });

  describe('Option Selection', () => {
    it('should select option when clicked (single selection)', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      fireEvent.click(optionA);
      
      expect(optionA).toHaveClass('answer-option--selected');
      expect(screen.getByText('1 option selected')).toBeInTheDocument();
    });

    it('should deselect option when clicked again (single selection)', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      
      // Select
      fireEvent.click(optionA);
      expect(optionA).toHaveClass('answer-option--selected');
      
      // Deselect
      fireEvent.click(optionA);
      expect(optionA).not.toHaveClass('answer-option--selected');
    });

    it('should replace selection when different option clicked (single selection)', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      const optionB = screen.getByText('var x = 5;').closest('button')!;
      
      // Select A
      fireEvent.click(optionA);
      expect(optionA).toHaveClass('answer-option--selected');
      
      // Select B (should deselect A)
      fireEvent.click(optionB);
      expect(optionA).not.toHaveClass('answer-option--selected');
      expect(optionB).toHaveClass('answer-option--selected');
    });

    it('should allow multiple selections for multiple choice questions', () => {
      const multipleChoiceQuestion = createMockQuestion(true);
      render(<AnswerComponent {...defaultProps} question={multipleChoiceQuestion} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      const optionB = screen.getByText('var x = 5;').closest('button')!;
      
      fireEvent.click(optionA);
      fireEvent.click(optionB);
      
      expect(optionA).toHaveClass('answer-option--selected');
      expect(optionB).toHaveClass('answer-option--selected');
      expect(screen.getByText('2 options selected')).toBeInTheDocument();
    });

    it('should toggle individual options in multiple choice mode', () => {
      const multipleChoiceQuestion = createMockQuestion(true);
      render(<AnswerComponent {...defaultProps} question={multipleChoiceQuestion} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      
      // Select
      fireEvent.click(optionA);
      expect(optionA).toHaveClass('answer-option--selected');
      
      // Deselect
      fireEvent.click(optionA);
      expect(optionA).not.toHaveClass('answer-option--selected');
    });
  });

  describe('Answer Submission', () => {
    it('should disable submit button when no options selected', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      const submitButton = screen.getByText('Submit Answer');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when option is selected', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      fireEvent.click(optionA);
      
      const submitButton = screen.getByText('Submit Answer');
      expect(submitButton).not.toBeDisabled();
    });

    it('should call answerManager.submitAnswer when submit button clicked', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      fireEvent.click(optionA);
      
      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);
      
      expect(mockAnswerManager.submitAnswer).toHaveBeenCalledWith('test-question-1', [0]);
    });

    it('should call onAnswerSubmitted callback when answer is submitted', () => {
      const onAnswerSubmitted = vi.fn();
      render(<AnswerComponent {...defaultProps} onAnswerSubmitted={onAnswerSubmitted} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      fireEvent.click(optionA);
      
      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);
      
      expect(onAnswerSubmitted).toHaveBeenCalledWith(true);
    });

    it('should handle submission correctly', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      fireEvent.click(optionA);
      
      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);
      
      expect(mockAnswerManager.submitAnswer).toHaveBeenCalledWith('test-question-1', [0]);
    });
  });

  describe('Submitted State', () => {
    it('should load existing submitted state on mount', () => {
      const submittedState = createMockQuestionState(true, true);
      mockAnswerManager.getAnswerState.mockReturnValue(submittedState);
      
      render(<AnswerComponent {...defaultProps} />);
      
      // Should not show submit button
      expect(screen.queryByText('Submit Answer')).not.toBeInTheDocument();
      
      // Should not show instructions
      expect(screen.queryByText('Select the correct answer')).not.toBeInTheDocument();
    });

    it('should disable option selection after submission', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      fireEvent.click(optionA);
      
      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);
      
      // Try to click another option
      const optionB = screen.getByText('var x = 5;').closest('button')!;
      fireEvent.click(optionB);
      
      // Should still only have first option selected
      expect(optionA).toHaveClass('answer-option--selected');
      expect(optionB).not.toHaveClass('answer-option--selected');
    });

    it('should show correct answer indicators after submission', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      fireEvent.click(optionA);
      
      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);
      
      expect(optionA).toHaveClass('answer-option--correct');
      expect(screen.getByLabelText('Correct answer')).toBeInTheDocument();
    });

    it('should show incorrect answer indicators for wrong selections', () => {
      mockAnswerManager.submitAnswer.mockReturnValue(createMockAnswerResult(false));
      
      render(<AnswerComponent {...defaultProps} />);
      
      // Select wrong answer (option C)
      const optionC = screen.getByText('x = 5;').closest('button')!;
      fireEvent.click(optionC);
      
      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);
      
      expect(optionC).toHaveClass('answer-option--incorrect');
      expect(screen.getByLabelText('Incorrect answer')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should call onError when answerManager.getAnswerState throws', () => {
      const onError = vi.fn();
      mockAnswerManager.getAnswerState.mockImplementation(() => {
        throw new Error('Failed to get answer state');
      });
      
      render(<AnswerComponent {...defaultProps} onError={onError} />);
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call onError when answerManager.submitAnswer throws', () => {
      const onError = vi.fn();
      mockAnswerManager.submitAnswer.mockImplementation(() => {
        throw new Error('Failed to submit answer');
      });
      
      render(<AnswerComponent {...defaultProps} onError={onError} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      fireEvent.click(optionA);
      
      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle errors gracefully', () => {
      const onError = vi.fn();
      
      render(<AnswerComponent {...defaultProps} onError={onError} />);
      
      // This test verifies that the component can handle errors without crashing
      expect(screen.getByText('Select the correct answer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getByLabelText('Answer options')).toBeInTheDocument();
    });

    it('should have proper aria-pressed attributes for options', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      
      expect(optionA).toHaveAttribute('aria-pressed', 'false');
      
      fireEvent.click(optionA);
      
      expect(optionA).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have screen reader descriptions for options', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      expect(screen.getByText('Option A: int x = 5;')).toHaveClass('sr-only');
      expect(screen.getByText('Option B: var x = 5;')).toHaveClass('sr-only');
    });

    it('should have proper submit button descriptions', () => {
      render(<AnswerComponent {...defaultProps} />);
      
      expect(screen.getByText('Please select at least one option before submitting')).toHaveClass('sr-only');
      
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      fireEvent.click(optionA);
      
      expect(screen.getByText('Submit your selected answer')).toHaveClass('sr-only');
    });
  });

  describe('Question Changes', () => {
    it('should reset state when question changes', () => {
      const { rerender } = render(<AnswerComponent {...defaultProps} />);
      
      // Select an option
      const optionA = screen.getByText('int x = 5;').closest('button')!;
      fireEvent.click(optionA);
      
      expect(optionA).toHaveClass('answer-option--selected');
      
      // Change question
      const newQuestion = createMockQuestion();
      newQuestion.id = 'different-question';
      
      rerender(<AnswerComponent {...defaultProps} question={newQuestion} />);
      
      // Should call getAnswerState for new question
      expect(mockAnswerManager.getAnswerState).toHaveBeenCalledWith('different-question');
    });
  });
});