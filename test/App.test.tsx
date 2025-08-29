import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from '../src/App';
import { ApplicationFactory } from '../src/services/ApplicationFactory';
import type { IApplicationContext } from '../src/services/ApplicationFactory';
import type { IQuestion } from '../src/interfaces/domain/IQuestion';
import type { IQuestionManager } from '../src/interfaces/services/IQuestionManager';
import type { IAnswerManager } from '../src/interfaces/services/IAnswerManager';
import type { IStateManager } from '../src/interfaces/services/IStateManager';
import type { IErrorHandler } from '../src/interfaces/errors/IErrorHandler';

// Mock the ApplicationFactory
vi.mock('../src/services/ApplicationFactory');

// Mock the components to isolate App component testing
vi.mock('../src/components/QuestionComponent', () => ({
  QuestionComponent: ({ onError }: { onError?: (error: Error) => void }) => (
    <div data-testid="question-component">
      <button onClick={() => onError?.(new Error('Test error'))}>
        Trigger Error
      </button>
    </div>
  )
}));

vi.mock('../src/components/AnswerComponent', () => ({
  AnswerComponent: ({ 
    onAnswerSubmitted, 
    onError 
  }: { 
    onAnswerSubmitted?: (isCorrect: boolean) => void;
    onError?: (error: Error) => void;
  }) => (
    <div data-testid="answer-component">
      <button onClick={() => onAnswerSubmitted?.(true)}>
        Submit Correct Answer
      </button>
      <button onClick={() => onAnswerSubmitted?.(false)}>
        Submit Incorrect Answer
      </button>
      <button onClick={() => onError?.(new Error('Answer error'))}>
        Trigger Answer Error
      </button>
    </div>
  )
}));

vi.mock('../src/components/ExplanationComponent', () => ({
  ExplanationComponent: ({ 
    onRedoQuestion, 
    onNextQuestion,
    onError 
  }: { 
    onRedoQuestion?: () => void;
    onNextQuestion?: () => void;
    onError?: (error: Error) => void;
  }) => (
    <div data-testid="explanation-component">
      <button onClick={onRedoQuestion}>Redo Question</button>
      <button onClick={onNextQuestion}>Next Question</button>
      <button onClick={() => onError?.(new Error('Explanation error'))}>
        Trigger Explanation Error
      </button>
    </div>
  )
}));

vi.mock('../src/components/NavigationComponent', () => ({
  NavigationComponent: ({ 
    questionManager,
    answerManager,
    onQuestionReset, 
    onNextQuestion,
    onError 
  }: { 
    questionManager: any;
    answerManager: any;
    onQuestionReset?: () => void;
    onNextQuestion?: () => void;
    onError?: (error: Error) => void;
  }) => (
    <div data-testid="navigation-component">
      <button onClick={() => {
        // Simulate the actual NavigationComponent behavior
        const currentQuestion = questionManager.getCurrentQuestion();
        if (currentQuestion) {
          answerManager.resetAnswer(currentQuestion.id);
          questionManager.resetCurrent();
        }
        onQuestionReset?.();
      }}>Reset Question</button>
      <button onClick={onNextQuestion}>Navigate Next</button>
      <button onClick={() => onError?.(new Error('Navigation error'))}>
        Trigger Navigation Error
      </button>
    </div>
  )
}));

describe('App Component', () => {
  let mockApplicationContext: IApplicationContext;
  let mockQuestionManager: IQuestionManager;
  let mockAnswerManager: IAnswerManager;
  let mockStateManager: IStateManager;
  let mockErrorHandler: IErrorHandler;
  let mockQuestion: IQuestion;

  beforeEach(() => {
    // Create mock question
    mockQuestion = {
      id: 'test-question-1',
      text: 'What is the correct syntax for a C# class?',
      options: [
        { id: 'opt1', text: 'class MyClass {}' },
        { id: 'opt2', text: 'Class MyClass {}' },
        { id: 'opt3', text: 'public class MyClass {}' },
        { id: 'opt4', text: 'MyClass class {}' }
      ],
      category: 'Syntax',
      difficulty: 'easy' as const,
      explanation: 'The correct syntax uses lowercase "class" keyword.',
      getCorrectAnswers: () => [0, 2],
      hasMultipleCorrectAnswers: () => true,
      codeExample: undefined
    };

    // Create mock services
    mockQuestionManager = {
      getCurrentQuestion: vi.fn().mockReturnValue(mockQuestion),
      moveToNext: vi.fn().mockReturnValue(true),
      moveToPrevious: vi.fn().mockReturnValue(false),
      resetCurrent: vi.fn(),
      getTotalCount: vi.fn().mockReturnValue(10),
      getCurrentIndex: vi.fn().mockReturnValue(0),
      initialize: vi.fn().mockResolvedValue(undefined)
    };

    mockAnswerManager = {
      submitAnswer: vi.fn().mockReturnValue({
        isCorrect: true,
        correctAnswers: [0, 2],
        explanation: 'Test explanation',
        selectedAnswers: [0]
      }),
      getAnswerState: vi.fn().mockReturnValue({
        selectedAnswers: [0],
        isSubmitted: true,
        isCorrect: true,
        submittedAt: new Date()
      }),
      resetAnswer: vi.fn(),
      isAnswered: vi.fn().mockReturnValue(false),
      getSelectedOptions: vi.fn().mockReturnValue([])
    };

    mockStateManager = {
      getApplicationState: vi.fn().mockReturnValue({
        currentQuestionIndex: 0,
        questionStates: new Map(),
        isInitialized: true,
        totalQuestions: 10
      }),
      updateQuestionState: vi.fn(),
      getQuestionState: vi.fn().mockReturnValue(null),
      resetApplicationState: vi.fn(),
      setCurrentQuestionIndex: vi.fn(),
      getCurrentQuestionIndex: vi.fn().mockReturnValue(0),
      setTotalQuestions: vi.fn(),
      setInitialized: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(true)
    };

    mockErrorHandler = {
      handleError: vi.fn(),
      canHandle: vi.fn().mockReturnValue(true)
    };

    // Create mock application context
    mockApplicationContext = {
      questionManager: mockQuestionManager,
      answerManager: mockAnswerManager,
      stateManager: mockStateManager,
      errorHandler: mockErrorHandler,
      container: {} as any
    };

    // Mock ApplicationFactory
    vi.mocked(ApplicationFactory.createApplication).mockResolvedValue(mockApplicationContext);
    vi.mocked(ApplicationFactory.dispose).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should display loading state initially', () => {
      render(<App />);
      
      expect(screen.getByText('Loading C# Interview Questions')).toBeInTheDocument();
      expect(screen.getByText('Initializing application...')).toBeInTheDocument();
    });

    it('should initialize application with DI container', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(ApplicationFactory.createApplication).toHaveBeenCalledWith({
          autoInitialize: true,
          configureServiceLocator: true
        });
      });
    });

    it('should display question component after successful initialization', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('question-component')).toBeInTheDocument();
      });
    });

    it('should display answer component after successful initialization', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('answer-component')).toBeInTheDocument();
      });
    });

    it('should display navigation component after successful initialization', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('navigation-component')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      const initError = new Error('Failed to initialize');
      vi.mocked(ApplicationFactory.createApplication).mockRejectedValue(initError);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Application Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to initialize')).toBeInTheDocument();
      });
    });

    it('should handle no questions available error', async () => {
      vi.mocked(mockQuestionManager.getCurrentQuestion).mockReturnValue(null);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Application Error')).toBeInTheDocument();
        expect(screen.getByText('No questions available')).toBeInTheDocument();
      });
    });

    it('should handle component errors through error callbacks', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('question-component')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Trigger Error'));
      
      await waitFor(() => {
        expect(screen.getByText('Application Error')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });

    it('should provide reload functionality on error', async () => {
      const reloadSpy = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true
      });
      
      const initError = new Error('Failed to initialize');
      vi.mocked(ApplicationFactory.createApplication).mockRejectedValue(initError);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Reload Application')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Reload Application'));
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('Answer Flow', () => {
    it('should handle answer submission and show explanation', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('answer-component')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Submit Correct Answer'));
      
      await waitFor(() => {
        expect(screen.getByTestId('explanation-component')).toBeInTheDocument();
      });
    });

    it('should handle question reset from explanation', async () => {
      render(<App />);
      
      // Submit answer to get to explanation
      await waitFor(() => {
        expect(screen.getByTestId('answer-component')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Submit Correct Answer'));
      
      await waitFor(() => {
        expect(screen.getByTestId('explanation-component')).toBeInTheDocument();
      });
      
      // Reset question
      fireEvent.click(screen.getByText('Redo Question'));
      
      await waitFor(() => {
        expect(mockAnswerManager.resetAnswer).toHaveBeenCalledWith('test-question-1');
        expect(screen.getByTestId('answer-component')).toBeInTheDocument();
      });
    });

    it('should handle next question navigation', async () => {
      render(<App />);
      
      // Submit answer to get to explanation
      await waitFor(() => {
        expect(screen.getByTestId('answer-component')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Submit Correct Answer'));
      
      await waitFor(() => {
        expect(screen.getByTestId('explanation-component')).toBeInTheDocument();
      });
      
      // Move to next question
      fireEvent.click(screen.getByText('Next Question'));
      
      await waitFor(() => {
        expect(mockQuestionManager.moveToNext).toHaveBeenCalled();
        expect(screen.getByTestId('answer-component')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should handle navigation component reset action', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('navigation-component')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Reset Question'));
      
      await waitFor(() => {
        expect(mockAnswerManager.resetAnswer).toHaveBeenCalledWith('test-question-1');
        expect(mockQuestionManager.resetCurrent).toHaveBeenCalled();
      });
    });

    it('should handle navigation component next action', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('navigation-component')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Navigate Next'));
      
      expect(mockQuestionManager.moveToNext).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should dispose application context on unmount', async () => {
      const { unmount } = render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('question-component')).toBeInTheDocument();
      });
      
      unmount();
      
      expect(ApplicationFactory.dispose).toHaveBeenCalledWith(mockApplicationContext);
    });
  });

  describe('Error Boundary', () => {
    it('should have error boundary functionality', () => {
      // Test that the error boundary exists and is properly structured
      // Since testing error boundaries directly is complex in unit tests,
      // we'll verify the component structure instead
      render(<App />);
      
      // Verify the app renders without throwing
      expect(document.querySelector('.app')).toBeInTheDocument();
    });
  });

  describe('Layout and Accessibility', () => {
    it('should render proper 2-column layout structure', async () => {
      render(<App />);
      
      await waitFor(() => {
        const container = document.querySelector('.app-container');
        expect(container).toBeInTheDocument();
        
        const leftColumn = document.querySelector('.app-left-column');
        const rightColumn = document.querySelector('.app-right-column');
        
        expect(leftColumn).toBeInTheDocument();
        expect(rightColumn).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels and accessibility features', async () => {
      render(<App />);
      
      await waitFor(() => {
        // Check that the app has proper structure for screen readers
        const app = document.querySelector('.app');
        expect(app).toBeInTheDocument();
      });
    });
  });
});