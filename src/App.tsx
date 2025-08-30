import React from 'react';
import { ApplicationFactory, type IApplicationContext } from './services/ApplicationFactory';
import { QuestionComponent } from './components/QuestionComponent';
import { AnswerComponent } from './components/AnswerComponent';
import { ExplanationComponent } from './components/ExplanationComponent';
import { NavigationComponent } from './components/NavigationComponent';
import type { IQuestion } from './interfaces/domain/IQuestion';
import type { IAnswerResult } from './interfaces/domain/types';
import './App.css';
import './components/MobileButtonFix.css';

/**
 * Application view state enumeration
 */
type AppViewState = 'loading' | 'question' | 'explanation' | 'error';

/**
 * Application state interface
 */
interface AppState {
  viewState: AppViewState;
  currentQuestion: IQuestion | null;
  currentQuestionIndex: number;
  answerResult: IAnswerResult | null;
  error: Error | null;
  isInitialized: boolean;
}

/**
 * Main application component that orchestrates all managers and components.
 * Implements proper dependency injection integration and component composition.
 * Follows requirements for 2-column layout and single-page interface.
 */
class App extends React.Component<{}, AppState> {
  private applicationContext: IApplicationContext | null = null;

  constructor(props: {}) {
    super(props);
    
    this.state = {
      viewState: 'loading',
      currentQuestion: null,
      currentQuestionIndex: 0,
      answerResult: null,
      error: null,
      isInitialized: false
    };
  }

  /**
   * Component lifecycle: Initialize application with DI container
   */
  async componentDidMount(): Promise<void> {
    try {
      // Create application context with all services configured via DI
      this.applicationContext = await ApplicationFactory.createApplication({
        autoInitialize: true,
        configureServiceLocator: true,
        bootstrapOptions: {
          enableRetry: true,
          maxRetries: 3,
          retryDelay: 1000
        }
      });

      // Initialize QuestionManager after bootstrap
      await this.applicationContext.questionManager.initialize();
      
      // Load initial question
      const currentQuestion = this.applicationContext.questionManager.getCurrentQuestion();
      const currentQuestionIndex = this.applicationContext.questionManager.getCurrentIndex();
      
      this.setState({
        viewState: currentQuestion ? 'question' : 'error',
        currentQuestion,
        currentQuestionIndex,
        isInitialized: true,
        error: currentQuestion ? null : new Error('No questions available')
      });
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to initialize application'));
    }
  }

  /**
   * Component lifecycle: Cleanup resources
   */
  componentWillUnmount(): void {
    if (this.applicationContext) {
      ApplicationFactory.dispose(this.applicationContext);
    }
  }

  /**
   * Centralized error handling following error boundary pattern
   */
  private handleError = (error: Error): void => {
    
    if (this.applicationContext?.errorHandler) {
      this.applicationContext.errorHandler.handleError(error);
    }
    
    this.setState({
      viewState: 'error',
      error
    });
  };

  /**
   * Handles answer submission from AnswerComponent
   */
  private handleAnswerSubmitted = (_isCorrect: boolean): void => {
    try {
      if (!this.applicationContext || !this.state.currentQuestion) {
        throw new Error('Cannot submit answer: application not properly initialized');
      }

      const questionId = this.state.currentQuestion.id;
      const answerState = this.applicationContext.answerManager.getAnswerState(questionId);
      
      if (!answerState || !answerState.isSubmitted) {
        throw new Error('Answer state not found after submission');
      }

      // Create answer result for explanation display
      const answerResult: IAnswerResult = {
        isCorrect: answerState.isCorrect,
        correctAnswers: this.state.currentQuestion.getCorrectAnswers(),
        explanation: this.state.currentQuestion.explanation,
        selectedAnswers: answerState.selectedAnswers
      };

      this.setState({
        viewState: 'explanation',
        answerResult
      });
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to handle answer submission'));
    }
  };

  /**
   * Handles question reset/redo action
   */
  private handleQuestionReset = (): void => {
    try {
      if (!this.applicationContext || !this.state.currentQuestion) {
        throw new Error('Cannot reset question: application not properly initialized');
      }

      // Reset answer state
      this.applicationContext.answerManager.resetAnswer(this.state.currentQuestion.id);
      
      // Return to question view
      this.setState({
        viewState: 'question',
        answerResult: null
      });
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to reset question'));
    }
  };

  /**
   * Handles navigation to next question
   */
  private handleNextQuestion = (): void => {
    try {
      if (!this.applicationContext) {
        throw new Error('Cannot navigate: application not properly initialized');
      }

      const moved = this.applicationContext.questionManager.moveToNext();
      
      if (moved) {
        const nextQuestion = this.applicationContext.questionManager.getCurrentQuestion();
        const nextQuestionIndex = this.applicationContext.questionManager.getCurrentIndex();
        
        this.setState({
          viewState: 'question',
          currentQuestion: nextQuestion,
          currentQuestionIndex: nextQuestionIndex,
          answerResult: null
        });
      } else {
        // At end of questions - could implement completion screen here
      }
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to navigate to next question'));
    }
  };

  /**
   * Renders the loading state
   */
  private renderLoading(): React.ReactElement {
    return (
      <div className="app-loading">
        <div className="app-loading-content">
          <div className="app-loading-spinner" />
          <h2>Loading C# Interview Questions</h2>
          <p>Initializing application...</p>
        </div>
      </div>
    );
  }

  /**
   * Renders the error state
   */
  private renderError(): React.ReactElement {
    const error = this.state.error;
    
    return (
      <div className="app-error">
        <div className="app-error-content">
          <div className="app-error-icon">⚠️</div>
          <h2>Application Error</h2>
          <p>{error?.message || 'An unexpected error occurred'}</p>
          <button 
            className="app-error-retry"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  /**
   * Renders the left column content (question and code)
   */
  private renderLeftColumn(): React.ReactElement {
    if (!this.applicationContext) {
      return <div className="app-column-error">Application not initialized</div>;
    }

    return (
      <div className="app-left-column">
        <QuestionComponent
          questionManager={this.applicationContext.questionManager}
          isAnswered={this.state.viewState === 'explanation'}
          currentQuestionIndex={this.state.currentQuestionIndex}
          onError={this.handleError}
        />
      </div>
    );
  }

  /**
   * Renders the right column content (answers or explanation)
   */
  private renderRightColumn(): React.ReactElement {
    if (!this.applicationContext || !this.state.currentQuestion) {
      return <div className="app-column-error">No question available</div>;
    }

    const { viewState, currentQuestion, answerResult } = this.state;

    if (viewState === 'explanation' && answerResult) {
      return (
        <div className="app-right-column">
          <ExplanationComponent
            question={currentQuestion}
            answerResult={answerResult}
            onRedoQuestion={this.handleQuestionReset}
            onNextQuestion={this.handleNextQuestion}
            onError={this.handleError}
          />
        </div>
      );
    }

    return (
      <div className="app-right-column">
        <AnswerComponent
          question={currentQuestion}
          answerManager={this.applicationContext.answerManager}
          onAnswerSubmitted={this.handleAnswerSubmitted}
          onError={this.handleError}
        />
      </div>
    );
  }

  /**
   * Renders the main application interface
   */
  private renderApplication(): React.ReactElement {
    return (
      <div className="app-main">
        <div className="app-container">
          {this.renderLeftColumn()}
          {this.renderRightColumn()}
        </div>
        
        {/* Navigation component for debugging/development - can be hidden in production */}
        {this.applicationContext && (
          <div className="app-navigation">
            <NavigationComponent
              questionManager={this.applicationContext.questionManager}
              answerManager={this.applicationContext.answerManager}
              onQuestionReset={this.handleQuestionReset}
              onNextQuestion={this.handleNextQuestion}
              onError={this.handleError}
            />
          </div>
        )}
      </div>
    );
  }

  /**
   * Main render method
   */
  render(): React.ReactElement {
    const { viewState } = this.state;

    return (
      <div className="app">
        {viewState === 'loading' && this.renderLoading()}
        {viewState === 'error' && this.renderError()}
        {(viewState === 'question' || viewState === 'explanation') && this.renderApplication()}
      </div>
    );
  }
}

/**
 * Error boundary wrapper component for application-level error handling
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="app-error-boundary">
          <div className="app-error-boundary-content">
            <h1>Something went wrong</h1>
            <p>The application encountered an unexpected error.</p>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.message}</pre>
              <pre>{this.state.error?.stack}</pre>
            </details>
            <button onClick={() => window.location.reload()}>
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Root application component with error boundary
 */
const AppWithErrorBoundary: React.FC = () => (
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

export default AppWithErrorBoundary;