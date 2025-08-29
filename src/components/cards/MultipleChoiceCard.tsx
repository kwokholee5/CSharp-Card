// Multiple Choice Card component for rendering MC questions with touch-friendly UI
// Follows existing card design patterns with mobile-first responsive design

import React, { useCallback } from 'react';
import type { MultipleChoiceQuestion } from '../../utils/types';
import './MultipleChoiceCard.css';

export interface MultipleChoiceCardProps {
  question: MultipleChoiceQuestion;
  selectedIndex: number | null;
  onOptionSelect: (index: number) => void;
  onSubmit: () => void;
  disabled?: boolean;
  showCorrectAnswer?: boolean;
  onKeyPress?: (event: React.KeyboardEvent) => void;
}

export const MultipleChoiceCard: React.FC<MultipleChoiceCardProps> = ({
  question,
  selectedIndex,
  onOptionSelect,
  onSubmit,
  disabled = false,
  showCorrectAnswer = false,
  onKeyPress
}) => {

  const handleOptionClick = useCallback((index: number) => {
    if (disabled) return;
    onOptionSelect(index);
  }, [disabled, onOptionSelect]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (onKeyPress) {
      onKeyPress(event);
    }
  }, [onKeyPress]);

  const getOptionClass = (index: number): string => {
    const baseClass = 'mc-option';
    const classes = [baseClass];

    // Selection state
    if (selectedIndex === index) {
      classes.push('selected');
    }

    // Feedback states (only shown when disabled/answered)
    if (disabled && showCorrectAnswer) {
      if (index === question.correctAnswerIndex) {
        classes.push('correct');
      } else if (selectedIndex === index && index !== question.correctAnswerIndex) {
        classes.push('incorrect');
      }
    }

    // Disabled state
    if (disabled) {
      classes.push('disabled');
    }

    return classes.join(' ');
  };

  const renderDifficulty = () => {
    const dots = [];
    for (let i = 1; i <= 10; i++) {
      dots.push(
        <span
          key={i}
          className={`difficulty-dot ${i <= question.difficulty ? 'filled' : ''}`}
          title={`Difficulty: ${question.difficulty}/10`}
        />
      );
    }
    return <div className="card-difficulty">{dots}</div>;
  };

  return (
    <div 
      className="mc-card-container"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="group"
      aria-label={`Multiple choice question: ${question.question}`}
    >
      <div className="mc-card-inner">
        {/* Header with category and difficulty */}
        <div className="mc-card-header">
          <div className="mc-card-category">
            <span>{question.category}</span>
            <span>•</span>
            <span>{question.subcategory}</span>
          </div>
          {renderDifficulty()}
        </div>

        {/* Options */}
        <div className="mc-options-container">
          {question.options.map((option, index) => (
            <button
              key={option.id}
              className={getOptionClass(index)}
              onClick={() => handleOptionClick(index)}
              disabled={disabled}
              role="radio"
              aria-checked={selectedIndex === index}
              aria-labelledby={`option-${option.id}-text`}
              title={!disabled ? `Press ${index + 1} to select` : undefined}
            >
              <div className="mc-option-content">
                <div className="mc-option-indicator">
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)} {/* A, B, C, D */}
                  </span>
                  <span className="option-number">
                    {index + 1}
                  </span>
                </div>
                
                <div 
                  className="mc-option-text"
                  id={`option-${option.id}-text`}
                >
                  {option.text}
                </div>

                {/* Feedback icons for answered state */}
                {disabled && showCorrectAnswer && (
                  <div className="mc-option-feedback">
                    {index === question.correctAnswerIndex && (
                      <span className="feedback-icon correct" aria-label="Correct answer">
                        ✓
                      </span>
                    )}
                    {selectedIndex === index && index !== question.correctAnswerIndex && (
                      <span className="feedback-icon incorrect" aria-label="Your incorrect answer">
                        ✗
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Option explanation (shown after answer) */}
              {disabled && showCorrectAnswer && option.explanation && (
                (index === question.correctAnswerIndex || selectedIndex === index) && (
                  <div className="mc-option-explanation">
                    <strong>
                      {index === question.correctAnswerIndex ? 'Why this is correct:' : 'Why this is incorrect:'}
                    </strong>
                    <p>{option.explanation}</p>
                  </div>
                )
              )}
            </button>
          ))}
        </div>

        {/* Submit area - only shown when option is selected but not yet submitted */}
        {selectedIndex !== null && !disabled && (
          <div className="mc-submit-area">
            <button
              className="mc-submit-button"
              onClick={onSubmit}
              title="Submit your answer (Enter)"
            >
              Submit Answer
            </button>
            <div className="mc-submit-hint">
              Press Enter to submit
            </div>
          </div>
        )}

        {/* Keyboard hints */}
        {!disabled && (
          <div className="mc-keyboard-hints">
            <div className="mc-hint">
              Use number keys 1-{question.options.length} to select options
            </div>
          </div>
        )}

        {/* Tags */}
        {question.tags.length > 0 && (
          <div className="mc-card-tags">
            {question.tags.map(tag => (
              <span key={tag} className="mc-tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mc-card-footer">
          <div className="mc-instruction">
            {disabled 
              ? 'Answer submitted' 
              : selectedIndex !== null 
                ? 'Click Submit or press Enter' 
                : 'Select an answer'
            }
          </div>
        </div>
      </div>
    </div>
  );
};