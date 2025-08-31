import React from 'react';
import type { IQuestion } from '../interfaces/domain/IQuestion';
import type { IAnswerManager } from '../interfaces/services/IAnswerManager';
import type { IQuestionState } from '../interfaces/domain/types';
import './AnswerComponent.css';
import './MobileAnswerLayout.css';

/**
 * Props interface for AnswerComponent following Interface Segregation Principle
 */
export interface AnswerComponentProps {
  /** Current question to display options for */
  question: IQuestion;
  
  /** Answer manager for handling option selection and submission */
  answerManager: IAnswerManager;
  
  /** Callback when an answer is submitted */
  onAnswerSubmitted?: (isCorrect: boolean) => void;
  
  /** Optional CSS class name for styling */
  className?: string;
  
  /** Optional callback when component encounters an error */
  onError?: (error: Error) => void;
}

/**
 * React component for displaying answer options in a 2x2 grid layout.
 * Follows Single Responsibility Principle by focusing only on option selection and submission.
 * Depends on abstractions (IAnswerManager) rather than concrete implementations.
 */
export const AnswerComponent: React.FC<AnswerComponentProps> = ({
  question,
  answerManager,
  onAnswerSubmitted,
  className = '',
  onError
}) => {
  const [selectedOptions, setSelectedOptions] = React.useState<number[]>([]);
  const [questionState, setQuestionState] = React.useState<IQuestionState | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  /**
   * Effect to load existing answer state when question changes
   */
  React.useEffect(() => {
    try {
      const existingState = answerManager.getAnswerState(question.id);
      setQuestionState(existingState);
      
      if (existingState && !existingState.isSubmitted) {
        setSelectedOptions(existingState.selectedAnswers);
      } else {
        setSelectedOptions([]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load answer state');
      if (onError) {
        onError(error);
      }
    }
  }, [question.id, answerManager, onError]);

  /**
   * Handles option selection/deselection
   */
  const handleOptionSelect = React.useCallback((optionIndex: number) => {
    if (questionState?.isSubmitted) {
      return; // Don't allow selection after submission
    }

    try {
      setSelectedOptions(prev => {
        const isCurrentlySelected = prev.includes(optionIndex);
        
        if (question.hasMultipleCorrectAnswers()) {
          // Multiple selection mode
          if (isCurrentlySelected) {
            return prev.filter(index => index !== optionIndex);
          } else {
            return [...prev, optionIndex].sort();
          }
        } else {
          // Single selection mode
          if (isCurrentlySelected) {
            return []; // Deselect if clicking the same option
          } else {
            return [optionIndex];
          }
        }
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to handle option selection');
      if (onError) {
        onError(error);
      }
    }
  }, [question, questionState?.isSubmitted, onError]);

  /**
   * Handles answer submission
   */
  const handleSubmitAnswer = React.useCallback(async () => {
    if (selectedOptions.length === 0 || questionState?.isSubmitted || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const result = answerManager.submitAnswer(question.id, selectedOptions);
      
      // Update local state to reflect submission
      const newState: IQuestionState = {
        selectedAnswers: selectedOptions,
        isSubmitted: true,
        isCorrect: result.isCorrect,
        submittedAt: new Date()
      };
      
      setQuestionState(newState);
      
      if (onAnswerSubmitted) {
        onAnswerSubmitted(result.isCorrect);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit answer');
      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOptions, questionState?.isSubmitted, isSubmitting, answerManager, question.id, onAnswerSubmitted, onError]);

  /**
   * Renders a single option button
   */
  const renderOption = (option: typeof question.options[0], index: number): React.ReactElement => {
    const isSelected = selectedOptions.includes(index);
    const isSubmitted = questionState?.isSubmitted || false;
    const isCorrect = question.getCorrectAnswers().includes(index);
    
    let optionClass = 'answer-option';
    
    if (isSelected) {
      optionClass += ' answer-option--selected';
    }
    
    if (isSubmitted) {
      optionClass += ' answer-option--submitted';
      if (isCorrect) {
        optionClass += ' answer-option--correct';
      } else if (isSelected && !isCorrect) {
        optionClass += ' answer-option--incorrect';
      }
    }

    return (
      <button
        key={option.id}
        className={optionClass}
        onClick={() => handleOptionSelect(index)}
        disabled={isSubmitted || isSubmitting}
        aria-pressed={isSelected}
        aria-describedby={`option-${index}-description`}
      >
        <div className="answer-option-content">
          <div className="answer-option-text">
            {option.text.split('\n').map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {line}
                {lineIndex < option.text.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
          {isSubmitted && isCorrect && (
            <div className="answer-option-status" aria-label="Correct answer">
              ✓
            </div>
          )}
          {isSubmitted && isSelected && !isCorrect && (
            <div className="answer-option-status answer-option-status--incorrect" aria-label="Incorrect answer">
              ✗
            </div>
          )}
        </div>
        <div id={`option-${index}-description`} className="sr-only">
          Option {String.fromCharCode(65 + index)}: {option.text.replace(/\n/g, ' ')}
        </div>
      </button>
    );
  };

  /**
   * Renders the options grid
   */
  const renderOptionsGrid = (): React.ReactElement => {
    // Type guard: Check if question has options array
    if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
      const errorMsg = `Question ${question.id} is not a multiple-choice question or has no options`;
      if (onError) {
        onError(new Error(errorMsg));
      }
      return (
        <div className="answer-error">
          <p>Error: This question does not have multiple choice options.</p>
          <p>Question type may be incompatible with this view.</p>
        </div>
      );
    }
    
    const options = question.options;
    
    return (
      <div className="answer-options-grid" role="radiogroup" aria-label="Answer options">
        {options.map((option, index) => renderOption(option, index))}
      </div>
    );
  };

  /**
   * Renders the submit button
   */
  const renderSubmitButton = (): React.ReactElement | null => {
    if (questionState?.isSubmitted) {
      return null; // Don't show submit button after submission
    }

    const canSubmit = selectedOptions.length > 0 && !isSubmitting;
    
    return (
      <div className="answer-submit-section">
        <button
          className={`answer-submit-button ${canSubmit ? 'answer-submit-button--enabled' : 'answer-submit-button--disabled'}`}
          onClick={handleSubmitAnswer}
          disabled={!canSubmit}
          aria-describedby="submit-button-description"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
        <div id="submit-button-description" className="sr-only">
          {selectedOptions.length === 0 
            ? 'Please select at least one option before submitting'
            : `Submit your selected answer${selectedOptions.length > 1 ? 's' : ''}`
          }
        </div>
      </div>
    );
  };

  /**
   * Renders selection instructions
   */
  const renderInstructions = (): React.ReactElement | null => {
    if (questionState?.isSubmitted) {
      return null;
    }

    try {
      const instructionText = question.hasMultipleCorrectAnswers()
        ? 'Select all correct answers'
        : 'Select the correct answer';

      return (
        <div className="answer-instructions">
          <p className="answer-instructions-text">{instructionText}</p>
          {selectedOptions.length > 0 && (
            <p className="answer-selection-count">
              {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to render instructions');
      if (onError) {
        onError(error);
      }
      return (
        <div className="answer-instructions">
          <p className="answer-instructions-text">Select an answer</p>
        </div>
      );
    }
  };

  return (
    <div className={`answer-component ${className}`}>
      <div className="answer-component-content">
        {renderInstructions()}
        {/* Temporarily hide MC options on mobile to test submit button */}
        <div className="mobile-mc-options-hidden">
          {renderOptionsGrid()}
        </div>
        <div className="answer-desktop-submit">
          {renderSubmitButton()}
        </div>
      </div>
      <div className="answer-footer">
        {renderSubmitButton()}
      </div>
    </div>
  );
};

export default AnswerComponent;