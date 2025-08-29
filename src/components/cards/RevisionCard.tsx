import React, { useState, useCallback, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import type { Question } from '../../utils/types';
import { getAnswerText } from '../../utils/types';
import './RevisionCard.css';

interface RevisionCardProps {
  question: Question;
  onKnown?: () => void;
  onUnknown?: () => void;
  onNext?: () => void;
}

export const RevisionCard: React.FC<RevisionCardProps> = ({
  question,
  onKnown,
  onUnknown,
  onNext
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when question changes
  useEffect(() => {
    setIsFlipped(false);
  }, [question?.id]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleFlip();
        break;
      case 'ArrowRight':
        if (onNext) {
          e.preventDefault();
          onNext();
        }
        break;
      case 'k':
        if (isFlipped && onKnown) {
          e.preventDefault();
          onKnown();
        }
        break;
      case 'u':
        if (isFlipped && onUnknown) {
          e.preventDefault();
          onUnknown();
        }
        break;
    }
  }, [handleFlip, isFlipped, onKnown, onUnknown, onNext]);

  const renderDifficulty = () => {
    const dots = [];
    for (let i = 1; i <= 10; i++) {
      dots.push(
        <span
          key={i}
          className={`difficulty-dot ${i <= question?.difficulty ? 'filled' : ''}`}
          title={`Difficulty: ${question?.difficulty}/10`}
        />
      );
    }
    return <div className="card-difficulty">{dots}</div>;
  };

  // Guard against undefined question
  if (!question) {
    return null;
  }

  return (
    <div
      className={`card-container ${isFlipped ? 'flipped' : ''}`}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Revision card: ${question.question}`}
      aria-expanded={isFlipped}
    >
      <div className="card-inner">
        {/* Front of card - Question */}
        <div className="card-face card-front">
          <div className="card-header">
            <div className="card-category">
              <span>{question.category}</span>
              <span>•</span>
              <span>{question.subcategory}</span>
            </div>
            {renderDifficulty()}
          </div>
          
          <div className="card-content">
            <h2 className="card-question">{question.question}</h2>
          </div>
          
          <div className="card-footer">
            <div className="flip-hint">
              <span>↻</span>
              <span>Click or press Space to reveal answer</span>
            </div>
          </div>
        </div>

        {/* Back of card - Answer */}
        <div className="card-face card-back">
          <div className="card-header">
            <div className="card-category">
              <span>{question.category}</span>
              <span>•</span>
              <span>{question.subcategory}</span>
            </div>
            {renderDifficulty()}
          </div>
          
          <div className="card-content">
            <div className="card-answer">{getAnswerText(question)}</div>
            
            {question.explanation && (
              <div className="card-explanation">
                <strong>Explanation:</strong><br />
                {question.explanation}
              </div>
            )}
            
            {question.codeExample && (
              <div className="code-example">
                <pre>{question.codeExample.code}</pre>
                {question.codeExample.output && (
                  <>
                    <div style={{ margin: '0.5rem 0', opacity: 0.7 }}>Output:</div>
                    <pre>{question.codeExample.output}</pre>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="card-tags">
            {question.tags.map(tag => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
          
          <div className="card-footer">
            <div className="flip-hint">
              <span>↻</span>
              <span>Click to see question again</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};