import React from 'react';
import './CardActions.css';

interface CardActionsProps {
  onKnown: () => void;
  onUnknown: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isFlipped: boolean;
}

export const CardActions: React.FC<CardActionsProps> = ({
  onKnown,
  onUnknown,
  onNext,
  onPrevious,
  canGoPrevious,
  canGoNext,
  isFlipped
}) => {
  return (
    <div className="card-actions">
      <div className="navigation-actions">
        <button
          className="action-button nav-button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          aria-label="Previous card"
          title="Previous card (←)"
        >
          ← Previous
        </button>
        
        <button
          className="action-button nav-button"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next card"
          title="Next card (→)"
        >
          Next →
        </button>
      </div>
      
      {isFlipped && (
        <div className="knowledge-actions">
          <button
            className="action-button unknown-button"
            onClick={onUnknown}
            aria-label="Mark as unknown"
            title="I don't know this (U)"
          >
            ❌ Don't Know
          </button>
          
          <button
            className="action-button known-button"
            onClick={onKnown}
            aria-label="Mark as known"
            title="I know this (K)"
          >
            ✅ Know It
          </button>
        </div>
      )}
      
      <div className="keyboard-hints">
        <span className="hint">Space: Flip</span>
        <span className="hint">←→: Navigate</span>
        {isFlipped && (
          <>
            <span className="hint">K: Know</span>
            <span className="hint">U: Unknown</span>
          </>
        )}
      </div>
    </div>
  );
};