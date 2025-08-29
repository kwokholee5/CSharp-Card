// Template Method Pattern - defines common study mode workflow
// Open/Closed Principle - open for extension through subclassing

import React from 'react';
import type { Question, UserProgress } from '../../utils/types';
import type { IAnswerValidator, ValidationResult, AnswerSubmission } from '../../services/study-modes/IAnswerValidator';
import type { IProgressTracker, StudyMetrics } from '../../services/study-modes/IProgressTracker';

// Base props that all study modes will receive
export interface StudyModeProps {
  questions: Question[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onSessionEnd: (metrics: StudyMetrics) => void;
  validator: IAnswerValidator;
  progressTracker: IProgressTracker;
  sessionId: string;
}

// State that all study modes share
export interface StudyModeState {
  currentQuestion: Question | null;
  isAnswered: boolean;
  validationResult: ValidationResult | null;
  progress: UserProgress | null;
  isLoading: boolean;
  error: string | null;
  startTime: Date;
}

// Abstract base class for all study modes
export abstract class AbstractStudyMode<TProps extends StudyModeProps = StudyModeProps> 
  extends React.Component<TProps, StudyModeState> {
  
  private answerStartTime: Date = new Date();

  constructor(props: TProps) {
    super(props);
    this.state = {
      currentQuestion: null,
      isAnswered: false,
      validationResult: null,
      progress: null,
      isLoading: true,
      error: null,
      startTime: new Date()
    };
  }

  // Template Method - defines the overall study flow
  public async componentDidMount(): Promise<void> {
    try {
      await this.initialize();
      await this.loadCurrentQuestion();
      this.onModeInitialized();
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  public async componentDidUpdate(prevProps: TProps): Promise<void> {
    if (prevProps.currentIndex !== this.props.currentIndex) {
      await this.loadCurrentQuestion();
    }
  }

  // Template methods - subclasses can override these hooks
  protected onModeInitialized(): void {
    // Default implementation does nothing
    // Subclasses can override to perform specific initialization
  }

  protected async onQuestionLoaded(_question: Question): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override to perform question-specific setup
  }

  protected async onAnswerValidated(_result: ValidationResult): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override to handle validation results
  }

  protected onNavigationRequested(direction: 'next' | 'previous'): void {
    // Default implementation calls props handlers
    if (direction === 'next') {
      this.props.onNext();
    } else {
      this.props.onPrevious();
    }
  }

  // Core workflow methods - these implement the template
  private async initialize(): Promise<void> {
    this.setState({ isLoading: true, error: null });
    
    // Ensure validator can handle our questions
    const { questions, validator } = this.props;
    const unsupportedQuestions = questions.filter(q => !validator.canValidate(q));
    
    if (unsupportedQuestions.length > 0) {
      throw new Error(`Validator cannot handle ${unsupportedQuestions.length} questions`);
    }
  }

  private async loadCurrentQuestion(): Promise<void> {
    const { questions, currentIndex, progressTracker } = this.props;
    
    if (currentIndex >= questions.length || currentIndex < 0) {
      this.setState({ currentQuestion: null, progress: null, isLoading: false });
      return;
    }

    const question = questions[currentIndex];
    this.answerStartTime = new Date();
    
    try {
      const progress = await progressTracker.getProgress(question.id);
      
      this.setState({
        currentQuestion: question,
        progress,
        isAnswered: false,
        validationResult: null,
        isLoading: false
      });

      await this.onQuestionLoaded(question);
      
    } catch (error) {
      this.handleError(`Failed to load question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Public method for subclasses to submit answers
  protected async submitAnswer(userAnswer: unknown): Promise<ValidationResult | null> {
    const { currentQuestion } = this.state;
    const { validator, progressTracker, sessionId } = this.props;

    if (!currentQuestion || this.state.isAnswered) {
      return null;
    }

    try {
      this.setState({ isLoading: true });

      const submission: AnswerSubmission = {
        questionId: currentQuestion.id,
        timestamp: new Date(),
        timeSpent: Date.now() - this.answerStartTime.getTime(),
        userAnswer
      };

      const result = validator.validateAnswer(currentQuestion, submission);
      const updatedProgress = await progressTracker.updateProgress(
        currentQuestion, 
        submission, 
        result, 
        sessionId
      );

      this.setState({
        isAnswered: true,
        validationResult: result,
        progress: updatedProgress,
        isLoading: false
      });

      await this.onAnswerValidated(result);
      
      return result;

    } catch (error) {
      this.handleError(`Failed to submit answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  // Navigation helpers
  protected handleNext = (): void => {
    this.onNavigationRequested('next');
  };

  protected handlePrevious = (): void => {
    this.onNavigationRequested('previous');
  };

  // Error handling
  private handleError(message: string): void {
    this.setState({ error: message, isLoading: false });
  }

  protected clearError = (): void => {
    this.setState({ error: null });
  };

  // Abstract methods - subclasses MUST implement these
  
  /**
   * Renders the question in the mode-specific way
   * @returns JSX for the question display
   */
  protected abstract renderQuestion(): React.ReactNode;

  /**
   * Renders the answer interface (options, input, etc.)
   * @returns JSX for the answer interface
   */
  protected abstract renderAnswerInterface(): React.ReactNode;

  /**
   * Renders feedback after answer submission
   * @returns JSX for the feedback display
   */
  protected abstract renderFeedback(): React.ReactNode;

  /**
   * Renders navigation controls
   * @returns JSX for navigation controls
   */
  protected abstract renderNavigation(): React.ReactNode;

  // Template method - final render structure
  public render(): React.ReactNode {
    const { isLoading, error, currentQuestion } = this.state;

    if (isLoading) {
      return this.renderLoading();
    }

    if (error) {
      return this.renderError();
    }

    if (!currentQuestion) {
      return this.renderNoQuestion();
    }

    return (
      <div className="study-mode-container">
        <div className="study-mode-header">
          {this.renderModeHeader()}
        </div>
        
        <div className="study-mode-content">
          <div className="question-section">
            {this.renderQuestion()}
          </div>
          
          <div className="answer-section">
            {this.renderAnswerInterface()}
          </div>
          
          <div className="feedback-section">
            {this.renderFeedback()}
          </div>
        </div>
        
        <div className="study-mode-footer">
          {this.renderNavigation()}
        </div>
      </div>
    );
  }

  // Default implementations for common renders
  protected renderLoading(): React.ReactNode {
    return <div className="study-mode-loading">Loading...</div>;
  }

  protected renderError(): React.ReactNode {
    return (
      <div className="study-mode-error">
        <p>Error: {this.state.error}</p>
        <button onClick={this.clearError}>Try Again</button>
      </div>
    );
  }

  protected renderNoQuestion(): React.ReactNode {
    return <div className="study-mode-no-question">No question available</div>;
  }

  protected renderModeHeader(): React.ReactNode {
    const { currentQuestion, progress } = this.state;
    const { currentIndex, questions } = this.props;
    
    return (
      <div className="mode-header">
        <div className="progress-indicator">
          {currentIndex + 1} of {questions.length}
        </div>
        {currentQuestion && (
          <div className="question-info">
            <span className="category">{currentQuestion.category}</span>
            <span className="difficulty">Difficulty: {currentQuestion.difficulty}/10</span>
          </div>
        )}
        {progress && (
          <div className="user-progress">
            Accuracy: {progress.consecutiveCorrect}/{progress.knownCount + progress.unknownCount}
          </div>
        )}
      </div>
    );
  }
}