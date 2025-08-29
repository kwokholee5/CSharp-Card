// Concrete implementation of AbstractStudyMode for Multiple Choice questions
// Template Method Pattern - extends the abstract workflow for MC-specific behavior

import React from 'react';
import type { Question } from '../../utils/types';
import { isMultipleChoiceQuestion } from '../../utils/types';
import { AbstractStudyMode, type StudyModeProps } from './AbstractStudyMode';
import { MultipleChoiceCard } from '../cards/MultipleChoiceCard';

export interface MultipleChoiceProps extends StudyModeProps {
  // Additional MC-specific props can be added here
  showExplanationOnIncorrect?: boolean;
  allowRetry?: boolean;
}

export class MultipleChoiceMode extends AbstractStudyMode<MultipleChoiceProps> {
  private selectedOptionIndex: number | null = null;
  private showFeedback: boolean = false;

  constructor(props: MultipleChoiceProps) {
    super(props);
  }

  // Template method hook - called when mode is initialized
  protected onModeInitialized(): void {
    // Reset selection state when mode initializes
    this.selectedOptionIndex = null;
    this.showFeedback = false;
  }

  // Template method hook - called when a new question is loaded
  protected async onQuestionLoaded(question: Question): Promise<void> {
    // Reset state for new question
    this.selectedOptionIndex = null;
    this.showFeedback = false;
    
    // Validate that this is a MC question
    if (!isMultipleChoiceQuestion(question)) {
      throw new Error('MultipleChoiceMode can only handle multiple-choice questions');
    }
  }

  // Template method hook - called after answer validation
  protected async onAnswerValidated(): Promise<void> {
    // Show feedback after answer is validated
    this.showFeedback = true;
    this.forceUpdate(); // Trigger re-render to show feedback
  }

  // Handle option selection
  private handleOptionSelect = (optionIndex: number): void => {
    if (this.state.isAnswered || this.state.isLoading) {
      return; // Don't allow selection if already answered or loading
    }

    this.selectedOptionIndex = optionIndex;
    this.forceUpdate(); // Update UI to show selection
  };

  // Handle answer submission
  private handleSubmit = async (): Promise<void> => {
    if (this.selectedOptionIndex === null || this.state.isAnswered) {
      return;
    }

    // Submit the answer using the base class method
    await this.submitAnswer({ selectedIndex: this.selectedOptionIndex });
  };

  // Handle retry (if allowed)
  private handleRetry = (): void => {
    if (!this.props.allowRetry) return;

    this.selectedOptionIndex = null;
    this.showFeedback = false;
    this.setState({
      isAnswered: false,
      validationResult: null
    });
  };

  // Handle keyboard navigation
  private handleKeyPress = (event: React.KeyboardEvent): void => {
    const { currentQuestion } = this.state;
    if (!currentQuestion || !isMultipleChoiceQuestion(currentQuestion)) return;

    const { key } = event;
    
    // Number keys 1-4 for option selection
    if (/^[1-4]$/.test(key)) {
      const optionIndex = parseInt(key, 10) - 1;
      if (optionIndex < currentQuestion.options.length) {
        event.preventDefault();
        this.handleOptionSelect(optionIndex);
      }
    }
    
    // Enter to submit
    if (key === 'Enter' && this.selectedOptionIndex !== null) {
      event.preventDefault();
      this.handleSubmit();
    }

    // R for retry (if allowed and answered)
    if (key === 'r' || key === 'R') {
      if (this.state.isAnswered && this.props.allowRetry) {
        event.preventDefault();
        this.handleRetry();
      }
    }
  };

  // Required abstract method implementations

  protected renderQuestion(): React.ReactNode {
    const { currentQuestion } = this.state;
    if (!currentQuestion || !isMultipleChoiceQuestion(currentQuestion)) {
      return <div>Invalid question type</div>;
    }

    return (
      <div className="mc-question-container">
        <h2 className="mc-question-text">{currentQuestion.question}</h2>
        
        {currentQuestion.codeExample && (
          <div className="mc-code-example">
            <pre className="code-block">
              <code>{currentQuestion.codeExample.code}</code>
            </pre>
            {currentQuestion.codeExample.output && (
              <div className="code-output">
                <div className="output-label">Output:</div>
                <pre><code>{currentQuestion.codeExample.output}</code></pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  protected renderAnswerInterface(): React.ReactNode {
    const { currentQuestion, isAnswered } = this.state;
    if (!currentQuestion || !isMultipleChoiceQuestion(currentQuestion)) {
      return null;
    }

    return (
      <MultipleChoiceCard
        question={currentQuestion}
        selectedIndex={this.selectedOptionIndex}
        onOptionSelect={this.handleOptionSelect}
        onSubmit={this.handleSubmit}
        disabled={isAnswered}
        showCorrectAnswer={isAnswered}
        onKeyPress={this.handleKeyPress}
      />
    );
  }

  protected renderFeedback(): React.ReactNode {
    const { validationResult, isAnswered } = this.state;
    
    if (!isAnswered || !validationResult || !this.showFeedback) {
      return null;
    }

    const feedbackClass = `mc-feedback ${validationResult.isCorrect ? 'correct' : 'incorrect'}`;
    
    return (
      <div className={feedbackClass}>
        <div className="feedback-content">
          <div className="feedback-message">
            <span className={`feedback-icon ${validationResult.isCorrect ? 'success' : 'error'}`}>
              {validationResult.isCorrect ? '✓' : '✗'}
            </span>
            <span className="feedback-text">{validationResult.feedback}</span>
          </div>
          
          {validationResult.score && (
            <div className="feedback-score">
              Score: {(validationResult.score * 100).toFixed(0)}%
            </div>
          )}
          
          {validationResult.explanation && (
            <div className="feedback-explanation">
              <h4>Explanation:</h4>
              <p>{validationResult.explanation}</p>
            </div>
          )}

          {this.props.allowRetry && !validationResult.isCorrect && (
            <button 
              className="retry-button"
              onClick={this.handleRetry}
              title="Press 'R' to retry"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  protected renderNavigation(): React.ReactNode {
    const { currentIndex, questions } = this.props;
    const { isAnswered } = this.state;
    
    return (
      <div className="mc-navigation">
        <button
          className="nav-button prev"
          onClick={this.handlePrevious}
          disabled={currentIndex === 0}
          title="Previous question"
        >
          ← Previous
        </button>
        
        <div className="nav-info">
          <span className="question-counter">
            {currentIndex + 1} of {questions.length}
          </span>
          {!isAnswered && this.selectedOptionIndex !== null && (
            <button
              className="submit-button"
              onClick={this.handleSubmit}
              title="Submit answer (Enter)"
            >
              Submit
            </button>
          )}
        </div>
        
        <button
          className="nav-button next"
          onClick={this.handleNext}
          disabled={currentIndex >= questions.length - 1}
          title="Next question"
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
        className="multiple-choice-mode"
        onKeyDown={this.handleKeyPress}
        tabIndex={0}
      >
        {super.render()}
      </div>
    );
  }
}