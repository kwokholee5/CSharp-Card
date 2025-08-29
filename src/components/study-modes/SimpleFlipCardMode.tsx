// Simple Flip Card Mode Component - Functional version for easy integration
// Focused on core flip card functionality without complex abstractions

import React, { useState, useCallback } from 'react';
import type { Question } from '../../utils/types';
import { isFlipCardQuestion } from '../../utils/types';
import { RevisionCard } from '../cards/RevisionCard';
import './StudyModes.css';

export interface SimpleFlipCardModeProps {
  questions: Question[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onKnown?: () => void;
  onUnknown?: () => void;
  autoFlipDelay?: number;
  allowAnswerBeforeFlip?: boolean;
}

export const SimpleFlipCardMode: React.FC<SimpleFlipCardModeProps> = ({
  questions,
  currentIndex,
  onNext,
  onPrevious,
  onKnown,
  onUnknown,
  autoFlipDelay,
  allowAnswerBeforeFlip = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Reset state when question changes
  React.useEffect(() => {
    setIsFlipped(false);
    setHasAnswered(false);
  }, [currentIndex, currentQuestion?.id]);

  // Auto-flip functionality
  React.useEffect(() => {
    if (autoFlipDelay && autoFlipDelay > 0 && !hasAnswered) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, autoFlipDelay);
      return () => clearTimeout(timer);
    }
  }, [autoFlipDelay, hasAnswered, currentQuestion?.id]);

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handleKnown = useCallback(() => {
    if (hasAnswered) return;
    setHasAnswered(true);
    onKnown?.();
  }, [hasAnswered, onKnown]);

  const handleUnknown = useCallback(() => {
    if (hasAnswered) return;
    setHasAnswered(true);
    onUnknown?.();
  }, [hasAnswered, onUnknown]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    const { key } = event;
    
    // Space/Enter to flip
    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      handleFlip();
    }
    
    // K for known (only after flip or if allowed before flip)
    if (key === 'k' || key === 'K') {
      if (isFlipped || allowAnswerBeforeFlip) {
        event.preventDefault();
        handleKnown();
      }
    }
    
    // U for unknown (only after flip or if allowed before flip)
    if (key === 'u' || key === 'U') {
      if (isFlipped || allowAnswerBeforeFlip) {
        event.preventDefault();
        handleUnknown();
      }
    }
  }, [isFlipped, allowAnswerBeforeFlip, handleFlip, handleKnown, handleUnknown]);

  if (!currentQuestion || !isFlipCardQuestion(currentQuestion)) {
    return (
      <div className="study-mode-error">
        <p>Invalid question type for flip card mode</p>
      </div>
    );
  }

  return (
    <div 
      className="simple-flip-card-mode"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      <div className="flip-card-container">
        <RevisionCard
          question={currentQuestion}
          onKnown={isFlipped || allowAnswerBeforeFlip ? handleKnown : undefined}
          onUnknown={isFlipped || allowAnswerBeforeFlip ? handleUnknown : undefined}
          onNext={onNext}
        />
        
        {!isFlipped && (
          <div className="flip-card-interface">
            <div className="flip-instruction">
              <span className="flip-icon">↻</span>
              <span>Click the card or press Space to see the answer</span>
            </div>
            
            {allowAnswerBeforeFlip && (
              <div className="pre-flip-actions">
                <p className="pre-flip-text">
                  Or answer based on your knowledge:
                </p>
                <div className="pre-flip-buttons">
                  <button
                    className="answer-button known"
                    onClick={handleKnown}
                    title="Press 'K' - I know this"
                    disabled={hasAnswered}
                  >
                    I Know This (K)
                  </button>
                  <button
                    className="answer-button unknown"
                    onClick={handleUnknown}
                    title="Press 'U' - I don't know this"
                    disabled={hasAnswered}
                  >
                    I Don't Know (U)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isFlipped && !hasAnswered && (
          <div className="flip-card-actions">
            <div className="answer-prompt">
              <h3>Did you know the answer?</h3>
              <div className="action-buttons">
                <button
                  className="answer-button known"
                  onClick={handleKnown}
                  title="Press 'K' - I knew this"
                  disabled={hasAnswered}
                >
                  ✓ I Knew This (K)
                </button>
                <button
                  className="answer-button unknown"
                  onClick={handleUnknown}
                  title="Press 'U' - I didn't know this"
                  disabled={hasAnswered}
                >
                  ✗ I Didn't Know (U)
                </button>
              </div>
            </div>
          </div>
        )}

        {hasAnswered && (
          <div className="flip-card-feedback">
            <div className="feedback-content">
              <div className="feedback-message">
                <span className="feedback-icon">
                  {hasAnswered ? '👍' : '📚'}
                </span>
                <span className="feedback-text">
                  {hasAnswered ? 'Great! Moving to next question...' : 'Keep studying this topic!'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flip-card-navigation">
        <button
          className="nav-button prev"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          title="Previous card (←)"
        >
          ← Previous
        </button>
        
        <div className="nav-info">
          <span className="card-counter">
            {currentIndex + 1} of {questions.length}
          </span>
          
          <div className="study-progress">
            {hasAnswered ? (
              <span className="answer-indicator answered">
                Answered ✓
              </span>
            ) : (
              <span className="instruction">
                {isFlipped ? 'Rate your knowledge' : 'Flip to see answer'}
              </span>
            )}
          </div>
        </div>
        
        <button
          className="nav-button next"
          onClick={onNext}
          disabled={currentIndex >= questions.length - 1}
          title="Next card (→)"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default SimpleFlipCardMode;