import React from 'react';
import type { IQuestion } from '../interfaces/domain/IQuestion';
import type { IAnswerResult } from '../interfaces/domain/types';
import './ExplanationComponent.css';
import './MobileAnswerLayout.css';

/**
 * Props interface for ExplanationComponent following Interface Segregation Principle
 */
export interface ExplanationComponentProps {
  /** Current question being explained */
  question: IQuestion;
  
  /** Answer result containing correctness and explanation details */
  answerResult: IAnswerResult;
  
  /** Callback when user wants to redo the current question */
  onRedoQuestion?: () => void;
  
  /** Callback when user wants to move to the next question */
  onNextQuestion?: () => void;
  
  /** Optional CSS class name for styling */
  className?: string;
  
  /** Optional callback when component encounters an error */
  onError?: (error: Error) => void;
}

/**
 * React component for displaying answer explanations and feedback.
 * Follows Single Responsibility Principle by focusing only on explanation display.
 * Shows correct answers, detailed reasoning, and navigation controls.
 */
export const ExplanationComponent: React.FC<ExplanationComponentProps> = ({
  question,
  answerResult,
  onRedoQuestion,
  onNextQuestion,
  className = '',
  onError
}) => {
  /**
   * Renders the result header with correctness indicator
   */
  const renderResultHeader = (): React.ReactElement => {
    const isCorrect = answerResult.isCorrect;
    const headerClass = `explanation-header ${isCorrect ? 'explanation-header--correct' : 'explanation-header--incorrect'}`;
    
    return (
      <div className={headerClass}>
        <div className="explanation-result-icon">
          {isCorrect ? '✓' : '✗'}
        </div>
        <div className="explanation-result-text">
          <h3 className="explanation-result-title">
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </h3>
          <p className="explanation-result-subtitle">
            {isCorrect 
              ? 'Well done! Your answer is correct.'
              : 'Don\'t worry, let\'s learn from this.'
            }
          </p>
        </div>
      </div>
    );
  };

  /**
   * Renders the answer options with correct/incorrect highlighting
   */
  const renderAnswerOptions = (): React.ReactElement => {
    try {
      const correctAnswers = answerResult.correctAnswers;
      const selectedAnswers = answerResult.selectedAnswers;
      
      return (
        <div className="explanation-options">
          <h4 className="explanation-options-title">Answer Options</h4>
          <div className="explanation-options-list">
            {question.options.map((option, index) => {
              const isCorrect = correctAnswers.includes(index);
              const wasSelected = selectedAnswers.includes(index);
              
              let optionClass = 'explanation-option';
              
              if (isCorrect) {
                optionClass += ' explanation-option--correct';
              }
              
              if (wasSelected && !isCorrect) {
                optionClass += ' explanation-option--incorrect-selected';
              }
              
              if (wasSelected && isCorrect) {
                optionClass += ' explanation-option--correct-selected';
              }
              
              return (
                <div key={option.id} className={optionClass}>
                  <div className="explanation-option-indicator">
                    {String.fromCharCode(65 + index)} {/* A, B, C, D */}
                  </div>
                  <div className="explanation-option-content">
                    <div className="explanation-option-text">
                      {option.text}
                    </div>
                    <div className="explanation-option-status">
                      {isCorrect && (
                        <span className="explanation-option-badge explanation-option-badge--correct">
                          Correct Answer
                        </span>
                      )}
                      {wasSelected && !isCorrect && (
                        <span className="explanation-option-badge explanation-option-badge--selected">
                          Your Selection
                        </span>
                      )}
                      {wasSelected && isCorrect && (
                        <span className="explanation-option-badge explanation-option-badge--correct-selected">
                          Your Correct Selection
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="explanation-option-icon">
                    {isCorrect && <span className="correct-icon">✓</span>}
                    {wasSelected && !isCorrect && <span className="incorrect-icon">✗</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to render answer options');
      if (onError) {
        onError(error);
      }
      
      return (
        <div className="explanation-options">
          <h4 className="explanation-options-title">Answer Options</h4>
          <div className="explanation-error">
            <p>Unable to display answer options</p>
          </div>
        </div>
      );
    }
  };

  /**
   * Renders the code output section (revealed after submission)
   */
  const renderCodeOutput = (): React.ReactElement | null => {
    if (!question.codeExample?.output) {
      return null;
    }

    return (
      <div className="explanation-code-output">
        <h4 className="explanation-code-output-title">Expected Output:</h4>
        <div className="explanation-code-output-content">
          <pre>{question.codeExample.output}</pre>
        </div>
      </div>
    );
  };

  /**
   * Renders the detailed explanation section
   */
  const renderExplanation = (): React.ReactElement => {
    return (
      <div className="explanation-details">
        <h4 className="explanation-details-title">Explanation</h4>
        <div className="explanation-details-content">
          <p className="explanation-text">{answerResult.explanation}</p>
        </div>
      </div>
    );
  };

  /**
   * Renders the navigation buttons
   */
  const renderNavigationButtons = (): React.ReactElement => {
    return (
      <div className="explanation-navigation">
        <button
          className="explanation-button explanation-button--redo"
          onClick={onRedoQuestion}
          disabled={!onRedoQuestion}
          aria-label="Redo this question"
        >
          <span className="explanation-button-icon">↻</span>
          <span className="explanation-button-text">Redo</span>
        </button>
        
        <button
          className="explanation-button explanation-button--next"
          onClick={onNextQuestion}
          disabled={!onNextQuestion}
          aria-label="Move to next question"
        >
          <span className="explanation-button-text">Next</span>
          <span className="explanation-button-icon">→</span>
        </button>
      </div>
    );
  };

  /**
   * Renders summary statistics
   */
  const renderSummary = (): React.ReactElement => {
    try {
      const totalOptions = question.options.length;
      const correctCount = answerResult.correctAnswers.length;
      const selectedCount = answerResult.selectedAnswers.length;
      const correctlySelectedCount = answerResult.selectedAnswers.filter(
        selected => answerResult.correctAnswers.includes(selected)
      ).length;
      
      return (
        <div className="explanation-summary">
          <div className="explanation-summary-stats">
            <div className="explanation-stat">
              <span className="explanation-stat-label">Correct Answers:</span>
              <span className="explanation-stat-value">{correctCount} of {totalOptions}</span>
            </div>
            <div className="explanation-stat">
              <span className="explanation-stat-label">Your Selection:</span>
              <span className="explanation-stat-value">{selectedCount} option{selectedCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="explanation-stat">
              <span className="explanation-stat-label">Correctly Selected:</span>
              <span className="explanation-stat-value">{correctlySelectedCount} of {correctCount}</span>
            </div>
          </div>
        </div>
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to render summary');
      if (onError) {
        onError(error);
      }
      
      return (
        <div className="explanation-summary">
          <div className="explanation-error">
            <p>Unable to display summary</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`explanation-component ${className}`}>
      <div className="explanation-component-content">
        {renderResultHeader()}
        {renderSummary()}
        {renderAnswerOptions()}
        {renderCodeOutput()}
        {renderExplanation()}
        <div className="explanation-desktop-nav">
          {renderNavigationButtons()}
        </div>
      </div>
      <div className="explanation-footer">
        {renderNavigationButtons()}
      </div>
    </div>
  );
};

export default ExplanationComponent;