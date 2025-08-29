// Simple Multiple Choice Mode Component - Functional version for easy integration
// Focused on core multiple choice functionality without complex abstractions

import React, { useState, useCallback } from 'react';
import type { Question } from '../../utils/types';
import { isMultipleChoiceQuestion } from '../../utils/types';
import { MultipleChoiceCard } from '../cards/MultipleChoiceCard';
import './StudyModes.css';

export interface SimpleMultipleChoiceModeProps {
  questions: Question[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswerSubmitted?: (isCorrect: boolean) => void;
  showExplanationOnIncorrect?: boolean;
  allowRetry?: boolean;
}

export const SimpleMultipleChoiceMode: React.FC<SimpleMultipleChoiceModeProps> = ({
  questions,
  currentIndex,
  onNext,
  onPrevious,
  onAnswerSubmitted,
  showExplanationOnIncorrect = true,
  allowRetry = false,
}) => {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Reset state when question changes
  React.useEffect(() => {
    setSelectedOptionIndex(null);
    setHasAnswered(false);
    setIsCorrect(null);
    setShowFeedback(false);
  }, [currentIndex, currentQuestion?.id]);

  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (hasAnswered) return;
    setSelectedOptionIndex(optionIndex);
  }, [hasAnswered]);

  const handleSubmit = useCallback(() => {
    if (selectedOptionIndex === null || hasAnswered || !isMultipleChoiceQuestion(currentQuestion)) {
      return;
    }

    const correct = selectedOptionIndex === currentQuestion.correctAnswerIndex;
    setIsCorrect(correct);
    setHasAnswered(true);
    setShowFeedback(true);
    
    onAnswerSubmitted?.(correct);
  }, [selectedOptionIndex, hasAnswered, currentQuestion, onAnswerSubmitted]);

  const handleRetry = useCallback(() => {
    if (!allowRetry) return;
    
    setSelectedOptionIndex(null);
    setHasAnswered(false);
    setIsCorrect(null);
    setShowFeedback(false);
  }, [allowRetry]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (!currentQuestion || !isMultipleChoiceQuestion(currentQuestion)) return;

    const { key } = event;
    
    // Number keys 1-4 for option selection
    if (/^[1-4]$/.test(key)) {
      const optionIndex = parseInt(key, 10) - 1;
      if (optionIndex < currentQuestion.options.length) {
        event.preventDefault();
        handleOptionSelect(optionIndex);
      }
    }
    
    // Enter to submit
    if (key === 'Enter' && selectedOptionIndex !== null) {
      event.preventDefault();
      handleSubmit();
    }

    // R for retry (if allowed and answered)
    if (key === 'r' || key === 'R') {
      if (hasAnswered && allowRetry) {
        event.preventDefault();
        handleRetry();
      }
    }
  }, [currentQuestion, handleOptionSelect, selectedOptionIndex, handleSubmit, hasAnswered, allowRetry, handleRetry]);

  if (!currentQuestion || !isMultipleChoiceQuestion(currentQuestion)) {
    return (
      <div className="study-mode-error">
        <p>Invalid question type for multiple choice mode</p>
      </div>
    );
  }

  return (
    <div 
      className="simple-multiple-choice-mode"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
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

      <MultipleChoiceCard
        question={currentQuestion}
        selectedIndex={selectedOptionIndex}
        onOptionSelect={handleOptionSelect}
        onSubmit={handleSubmit}
        disabled={hasAnswered}
        showCorrectAnswer={hasAnswered}
        onKeyPress={handleKeyPress}
      />

      {showFeedback && (
        <div className={`mc-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="feedback-content">
            <div className="feedback-message">
              <span className={`feedback-icon ${isCorrect ? 'success' : 'error'}`}>
                {isCorrect ? '✓' : '✗'}
              </span>
              <span className="feedback-text">
                {isCorrect ? 'Correct! Well done.' : 'Incorrect. The correct answer is highlighted.'}
              </span>
            </div>
            
            {!isCorrect && showExplanationOnIncorrect && currentQuestion.explanation && (
              <div className="feedback-explanation">
                <h4>Explanation:</h4>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}

            {allowRetry && !isCorrect && (
              <button 
                className="retry-button"
                onClick={handleRetry}
                title="Press 'R' to retry"
              >
                Try Again (R)
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mc-navigation">
        <button
          className="nav-button prev"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          title="Previous question"
        >
          ← Previous
        </button>
        
        <div className="nav-info">
          <span className="question-counter">
            {currentIndex + 1} of {questions.length}
          </span>
          {!hasAnswered && selectedOptionIndex !== null && (
            <button
              className="submit-button"
              onClick={handleSubmit}
              title="Submit answer (Enter)"
            >
              Submit
            </button>
          )}
          {hasAnswered && (
            <span className={`result-indicator ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
            </span>
          )}
        </div>
        
        <button
          className="nav-button next"
          onClick={onNext}
          disabled={currentIndex >= questions.length - 1}
          title="Next question"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default SimpleMultipleChoiceMode;