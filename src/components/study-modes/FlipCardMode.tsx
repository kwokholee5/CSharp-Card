// Concrete implementation of AbstractStudyMode for Flip Card questions
// Template Method Pattern - extends the abstract workflow for flip card behavior

import React from 'react';
import type { Question } from '../../utils/types';
import { isFlipCardQuestion } from '../../utils/types';
import { AbstractStudyMode, type StudyModeProps } from './AbstractStudyMode';
import { RevisionCard } from '../cards/RevisionCard';

export interface FlipCardProps extends StudyModeProps {
  // Additional flip card specific props
  autoFlipDelay?: number; // Auto-flip after delay (optional)
  allowAnswerBeforeFlip?: boolean; // Allow Known/Unknown before seeing answer
}

export class FlipCardMode extends AbstractStudyMode<FlipCardProps> {
  private isFlipped: boolean = false;
  private userAnswer: 'known' | 'unknown' | null = null;

  constructor(props: FlipCardProps) {
    super(props);
  }

  // Template method hook - called when mode is initialized
  protected onModeInitialized(): void {
    // Reset flip state when mode initializes
    this.isFlipped = false;
    this.userAnswer = null;
  }

  // Template method hook - called when a new question is loaded
  protected async onQuestionLoaded(question: Question): Promise<void> {
    // Reset state for new question
    this.isFlipped = false;
    this.userAnswer = null;
    
    // Validate that this is a flip card question
    if (!isFlipCardQuestion(question)) {
      throw new Error('FlipCardMode can only handle flip-card questions');
    }

    // Auto-flip functionality (if enabled)
    if (this.props.autoFlipDelay && this.props.autoFlipDelay > 0) {
      setTimeout(() => {
        if (!this.state.isAnswered) {
          this.handleFlip();
        }
      }, this.props.autoFlipDelay);
    }
  }

  // Handle card flip
  private handleFlip = (): void => {
    this.isFlipped = !this.isFlipped;
    this.forceUpdate(); // Trigger re-render to show flip
  };

  // Handle known answer
  private handleKnown = async (): Promise<void> => {
    if (this.state.isAnswered) return;
    
    this.userAnswer = 'known';
    await this.submitAnswer({ userKnows: true });
  };

  // Handle unknown answer
  private handleUnknown = async (): Promise<void> => {
    if (this.state.isAnswered) return;
    
    this.userAnswer = 'unknown';
    await this.submitAnswer({ userKnows: false });
  };

  // Handle keyboard navigation
  private handleKeyPress = (event: React.KeyboardEvent): void => {
    const { key } = event;
    
    // Space/Enter to flip
    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      this.handleFlip();
    }
    
    // K for known (only after flip or if allowed before flip)
    if (key === 'k' || key === 'K') {
      if (this.isFlipped || this.props.allowAnswerBeforeFlip) {
        event.preventDefault();
        this.handleKnown();
      }
    }
    
    // U for unknown (only after flip or if allowed before flip)
    if (key === 'u' || key === 'U') {
      if (this.isFlipped || this.props.allowAnswerBeforeFlip) {
        event.preventDefault();
        this.handleUnknown();
      }
    }
  };

  // Required abstract method implementations

  protected renderQuestion(): React.ReactNode {
    const { currentQuestion } = this.state;
    if (!currentQuestion || !isFlipCardQuestion(currentQuestion)) {
      return <div>Invalid question type</div>;
    }

    return (
      <RevisionCard
        question={currentQuestion}
        onKnown={this.isFlipped || this.props.allowAnswerBeforeFlip ? this.handleKnown : undefined}
        onUnknown={this.isFlipped || this.props.allowAnswerBeforeFlip ? this.handleUnknown : undefined}
        onNext={this.handleNext}
      />
    );
  }

  protected renderAnswerInterface(): React.ReactNode {
    const { isAnswered } = this.state;
    
    // For flip cards, the answer interface is integrated into the card itself
    // But we can show additional controls here if needed
    
    if (isAnswered) {
      return null; // No additional interface needed after answering
    }

    // Show flip instruction if not flipped yet
    if (!this.isFlipped) {
      return (
        <div className="flip-card-interface">
          <div className="flip-instruction">
            <span className="flip-icon">↻</span>
            <span>Click the card or press Space to see the answer</span>
          </div>
          
          {this.props.allowAnswerBeforeFlip && (
            <div className="pre-flip-actions">
              <p className="pre-flip-text">
                Or answer based on your knowledge:
              </p>
              <div className="pre-flip-buttons">
                <button
                  className="answer-button known"
                  onClick={this.handleKnown}
                  title="Press 'K' - I know this"
                >
                  I Know This (K)
                </button>
                <button
                  className="answer-button unknown"
                  onClick={this.handleUnknown}
                  title="Press 'U' - I don't know this"
                >
                  I Don't Know (U)
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Show answer actions after flip
    return (
      <div className="flip-card-actions">
        <div className="answer-prompt">
          <h3>Did you know the answer?</h3>
          <div className="action-buttons">
            <button
              className="answer-button known"
              onClick={this.handleKnown}
              title="Press 'K' - I knew this"
            >
              ✓ I Knew This (K)
            </button>
            <button
              className="answer-button unknown"
              onClick={this.handleUnknown}
              title="Press 'U' - I didn't know this"
            >
              ✗ I Didn't Know (U)
            </button>
          </div>
        </div>
      </div>
    );
  }

  protected renderFeedback(): React.ReactNode {
    const { validationResult, isAnswered } = this.state;
    
    if (!isAnswered || !validationResult) {
      return null;
    }

    const feedbackClass = `flip-card-feedback ${this.userAnswer}`;
    
    return (
      <div className={feedbackClass}>
        <div className="feedback-content">
          <div className="feedback-message">
            <span className={`feedback-icon ${this.userAnswer === 'known' ? 'success' : 'study'}`}>
              {this.userAnswer === 'known' ? '🎉' : '📚'}
            </span>
            <span className="feedback-text">{validationResult.feedback}</span>
          </div>
          
          {validationResult.score && (
            <div className="feedback-score">
              Progress: {(validationResult.score * 100).toFixed(0)}%
            </div>
          )}
          
          {validationResult.explanation && (
            <div className="feedback-explanation">
              <h4>Study Tip:</h4>
              <p>{validationResult.explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  protected renderNavigation(): React.ReactNode {
    const { currentIndex, questions } = this.props;
    const { isAnswered } = this.state;
    
    return (
      <div className="flip-card-navigation">
        <button
          className="nav-button prev"
          onClick={this.handlePrevious}
          disabled={currentIndex === 0}
          title="Previous card (←)"
        >
          ← Previous
        </button>
        
        <div className="nav-info">
          <span className="card-counter">
            {currentIndex + 1} of {questions.length}
          </span>
          
          {/* Study mode specific info */}
          <div className="study-progress">
            {isAnswered ? (
              <span className={`answer-indicator ${this.userAnswer}`}>
                {this.userAnswer === 'known' ? 'Known ✓' : 'Study More 📚'}
              </span>
            ) : (
              <span className="instruction">
                {this.isFlipped ? 'Rate your knowledge' : 'Flip to see answer'}
              </span>
            )}
          </div>
        </div>
        
        <button
          className="nav-button next"
          onClick={this.handleNext}
          disabled={currentIndex >= questions.length - 1}
          title="Next card (→)"
        >
          Next →
        </button>
      </div>
    );
  }

  // Override render to add keyboard event handling
  public render(): React.ReactNode {
    return (
      <div 
        className="flip-card-mode"
        onKeyDown={this.handleKeyPress}
        tabIndex={0}
      >
        {super.render()}
      </div>
    );
  }
}