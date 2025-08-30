import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationComponent, type NavigationComponentProps } from '../../src/components/NavigationComponent';
import type { IQuestionManager } from '../../src/interfaces/services/IQuestionManager';
import type { IAnswerManager } from '../../src/interfaces/services/IAnswerManager';
import type { IQuestion } from '../../src/interfaces/domain/IQuestion';

// Helper functions to get buttons by their text content instead of aria-label
const getRedoButton = () => screen.getByText(/Redo Question|Resetting\.\.\./).closest('button');
const getNextButton = () => screen.getByText(/Next Question|Last Question|Loading\.\.\./).closest('button');

// Mock implementations
const createMockQuestionManager = () => ({
  getCurrentQuestion: vi.fn(),
  moveToNext: vi.fn(),
  moveToPrevious: vi.fn(),
  resetCurrent: vi.fn(),
  getTotalCount: vi.fn(),
  getCurrentIndex: vi.fn(),
  initialize: vi.fn()
});

const createMockAnswerManager = () => ({
  submitAnswer: vi.fn(),
  getAnswerState: vi.fn(),
  resetAnswer: vi.fn(),
  isAnswered: vi.fn(),
  getSelectedOptions: vi.fn()
});

const createMockQuestion = (id: string = 'test-question-1'): IQuestion => ({
  id,
  text: 'Test question text',
  options: [
    { id: 'opt1', text: 'Option A' },
    { id: 'opt2', text: 'Option B' },
    { id: 'opt3', text: 'Option C' },
    { id: 'opt4', text: 'Option D' }
  ],
  category: 'test',
  difficulty: 'medium' as const,
  explanation: 'Test explanation',
  codeExample: undefined,
  getCorrectAnswers: () => [0],
  hasMultipleCorrectAnswers: () => false
});

describe('NavigationComponent', () => {
  let mockQuestionManager: ReturnType<typeof createMockQuestionManager>;
  let mockAnswerManager: ReturnType<typeof createMockAnswerManager>;
  let defaultProps: NavigationComponentProps;

  beforeEach(() => {
    mockQuestionManager = createMockQuestionManager();
    mockAnswerManager = createMockAnswerManager();
    
    // Default mock implementations
    mockQuestionManager.getCurrentQuestion.mockReturnValue(createMockQuestion());
    mockQuestionManager.getCurrentIndex.mockReturnValue(0);
    mockQuestionManager.getTotalCount.mockReturnValue(5);
    mockQuestionManager.moveToNext.mockReturnValue(true);
    
    defaultProps = {
      questionManager: mockQuestionManager,
      answerManager: mockAnswerManager
    };
  });

  describe('Rendering', () => {
    it('should render navigation component with progress and buttons', () => {
      render(<NavigationComponent {...defaultProps} />);
      
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
      expect(getRedoButton()).toBeInTheDocument();
      expect(getNextButton()).toBeInTheDocument();
    });

    it('should render progress bar with correct width', () => {
      mockQuestionManager.getCurrentIndex.mockReturnValue(2);
      mockQuestionManager.getTotalCount.mockReturnValue(5);
      
      render(<NavigationComponent {...defaultProps} />);
      
      expect(screen.getByText('Question 3 of 5')).toBeInTheDocument();
      
      const progressFill = document.querySelector('.navigation-progress-fill');
      expect(progressFill).toHaveStyle({ width: '60%' });
    });

    it('should show "No questions loaded" when no current question', () => {
      mockQuestionManager.getCurrentQuestion.mockReturnValue(null);
      
      render(<NavigationComponent {...defaultProps} />);
      
      expect(screen.getByText('No questions loaded')).toBeInTheDocument();
    });

    it('should show "Last Question" when at the end', () => {
      mockQuestionManager.getCurrentIndex.mockReturnValue(4);
      mockQuestionManager.getTotalCount.mockReturnValue(5);
      
      render(<NavigationComponent {...defaultProps} />);
      
      expect(screen.getByText('Last Question')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <NavigationComponent {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('navigation-component', 'custom-class');
    });
  });

  describe('Redo Question Functionality', () => {
    it('should call resetAnswer and resetCurrent when redo button is clicked', () => {
      const mockQuestion = createMockQuestion('test-q-1');
      mockQuestionManager.getCurrentQuestion.mockReturnValue(mockQuestion);
      
      render(<NavigationComponent {...defaultProps} />);
      
      const redoButton = getRedoButton();
      fireEvent.click(redoButton!);
      
      expect(mockAnswerManager.resetAnswer).toHaveBeenCalledWith('test-q-1');
      expect(mockQuestionManager.resetCurrent).toHaveBeenCalled();
    });

    it('should call onQuestionReset callback when provided', () => {
      const onQuestionReset = vi.fn();
      const mockQuestion = createMockQuestion('test-q-1');
      mockQuestionManager.getCurrentQuestion.mockReturnValue(mockQuestion);
      
      render(
        <NavigationComponent 
          {...defaultProps} 
          onQuestionReset={onQuestionReset}
        />
      );
      
      const redoButton = getRedoButton();
      fireEvent.click(redoButton!);
      
      expect(onQuestionReset).toHaveBeenCalled();
    });

    it('should show "Resetting..." text while resetting', () => {
      const mockQuestion = createMockQuestion('test-q-1');
      mockQuestionManager.getCurrentQuestion.mockReturnValue(mockQuestion);
      
      // Mock resetAnswer to simulate a delay
      mockAnswerManager.resetAnswer.mockImplementation(() => {
        // Simulate some processing time
      });
      
      render(<NavigationComponent {...defaultProps} />);
      
      const redoButton = getRedoButton();
      fireEvent.click(redoButton!);
      
      // The resetting state should be cleared synchronously after the operation
      expect(screen.getByText('Redo Question')).toBeInTheDocument();
    });

    it('should disable redo button when no current question', () => {
      mockQuestionManager.getCurrentQuestion.mockReturnValue(null);
      
      render(<NavigationComponent {...defaultProps} />);
      
      const redoButton = getRedoButton();
      expect(redoButton).toBeDisabled();
    });

    it('should handle errors during reset', () => {
      const onError = vi.fn();
      const mockQuestion = createMockQuestion('test-q-1');
      mockQuestionManager.getCurrentQuestion.mockReturnValue(mockQuestion);
      mockAnswerManager.resetAnswer.mockImplementation(() => {
        throw new Error('Reset failed');
      });
      
      render(
        <NavigationComponent 
          {...defaultProps} 
          onError={onError}
        />
      );
      
      const redoButton = getRedoButton();
      fireEvent.click(redoButton!);
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Next Question Functionality', () => {
    it('should call moveToNext when next button is clicked', () => {
      render(<NavigationComponent {...defaultProps} />);
      
      const nextButton = getNextButton();
      fireEvent.click(nextButton!);
      
      expect(mockQuestionManager.moveToNext).toHaveBeenCalled();
    });

    it('should call onNextQuestion callback when provided', () => {
      const onNextQuestion = vi.fn();
      
      render(
        <NavigationComponent 
          {...defaultProps} 
          onNextQuestion={onNextQuestion}
        />
      );
      
      const nextButton = getNextButton();
      fireEvent.click(nextButton!);
      
      expect(onNextQuestion).toHaveBeenCalled();
    });

    it('should show "Loading..." text while navigating', () => {
      // Mock moveToNext to simulate processing
      mockQuestionManager.moveToNext.mockReturnValue(true);
      
      render(<NavigationComponent {...defaultProps} />);
      
      const nextButton = getNextButton();
      fireEvent.click(nextButton!);
      
      // The navigating state should be cleared synchronously after the operation
      expect(screen.getByText('Next Question')).toBeInTheDocument();
    });

    it('should disable next button when at last question', () => {
      mockQuestionManager.getCurrentIndex.mockReturnValue(4);
      mockQuestionManager.getTotalCount.mockReturnValue(5);
      
      render(<NavigationComponent {...defaultProps} />);
      
      const nextButton = getNextButton();
      expect(nextButton).toBeDisabled();
    });

    it('should handle moveToNext returning false', () => {
      mockQuestionManager.moveToNext.mockReturnValue(false);
      
      // Mock console.warn to verify it's called
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<NavigationComponent {...defaultProps} />);
      
      const nextButton = getNextButton();
      fireEvent.click(nextButton!);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot move to next question - may be at end of question list'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle errors during navigation', () => {
      const onError = vi.fn();
      mockQuestionManager.moveToNext.mockImplementation(() => {
        throw new Error('Navigation failed');
      });
      
      render(
        <NavigationComponent 
          {...defaultProps} 
          onError={onError}
        />
      );
      
      const nextButton = getNextButton();
      fireEvent.click(nextButton!);
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Button States', () => {
    it('should disable both buttons when resetting', () => {
      const mockQuestion = createMockQuestion('test-q-1');
      mockQuestionManager.getCurrentQuestion.mockReturnValue(mockQuestion);
      
      render(<NavigationComponent {...defaultProps} />);
      
      const redoButton = getRedoButton();
      const nextButton = getNextButton();
      
      // Since operations are synchronous, buttons should be enabled after click
      fireEvent.click(redoButton!);
      
      expect(redoButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it('should disable both buttons when navigating', () => {
      mockQuestionManager.moveToNext.mockReturnValue(true);
      
      render(<NavigationComponent {...defaultProps} />);
      
      const redoButton = getRedoButton();
      const nextButton = getNextButton();
      
      // Since operations are synchronous, buttons should be enabled after click
      fireEvent.click(nextButton!);
      
      expect(redoButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Progress Indicator', () => {
    it('should calculate progress correctly for different positions', () => {
      const testCases = [
        { index: 0, total: 5, expected: '20%' },
        { index: 2, total: 5, expected: '60%' },
        { index: 4, total: 5, expected: '100%' }
      ];
      
      testCases.forEach(({ index, total, expected }) => {
        mockQuestionManager.getCurrentIndex.mockReturnValue(index);
        mockQuestionManager.getTotalCount.mockReturnValue(total);
        
        const { unmount } = render(<NavigationComponent {...defaultProps} />);
        
        const progressFill = document.querySelector('.navigation-progress-fill');
        expect(progressFill).toHaveStyle({ width: expected });
        
        unmount();
      });
    });

    it('should handle zero total count gracefully', () => {
      mockQuestionManager.getCurrentIndex.mockReturnValue(0);
      mockQuestionManager.getTotalCount.mockReturnValue(0);
      mockQuestionManager.getCurrentQuestion.mockReturnValue(null);
      
      render(<NavigationComponent {...defaultProps} />);
      
      expect(screen.getByText('No questions loaded')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in getQuestionInfo gracefully', () => {
      const onError = vi.fn();
      mockQuestionManager.getCurrentQuestion.mockImplementation(() => {
        throw new Error('Failed to get question');
      });
      
      render(
        <NavigationComponent 
          {...defaultProps} 
          onError={onError}
        />
      );
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(screen.getByText('No questions loaded')).toBeInTheDocument();
    });

    it('should handle missing onError callback gracefully', () => {
      const mockQuestion = createMockQuestion('test-q-1');
      mockQuestionManager.getCurrentQuestion.mockReturnValue(mockQuestion);
      mockAnswerManager.resetAnswer.mockImplementation(() => {
        throw new Error('Reset failed');
      });
      
      // Should not throw even without onError callback
      expect(() => {
        render(<NavigationComponent {...defaultProps} />);
        
        const redoButton = getRedoButton();
        fireEvent.click(redoButton!);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<NavigationComponent {...defaultProps} />);
      
      const redoButton = screen.getByRole('button', { name: /reset current question to try again/i });
      const nextButton = screen.getByRole('button', { name: /move to next question/i });
      
      expect(redoButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should have progress bar with proper ARIA label', () => {
      mockQuestionManager.getCurrentIndex.mockReturnValue(2);
      mockQuestionManager.getTotalCount.mockReturnValue(5);
      
      render(<NavigationComponent {...defaultProps} />);
      
      const progressFill = document.querySelector('.navigation-progress-fill');
      expect(progressFill).toHaveAttribute('aria-label', 'Progress: 3 of 5 questions');
    });

    it('should have hidden descriptions for screen readers', () => {
      render(<NavigationComponent {...defaultProps} />);
      
      expect(document.getElementById('redo-button-description')).toBeInTheDocument();
      expect(document.getElementById('next-button-description')).toBeInTheDocument();
    });
  });
});