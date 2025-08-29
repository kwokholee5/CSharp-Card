// Mode Selector Component - UI for choosing between study modes
// Provides clear mode indicators and smooth switching experience

import React from 'react';
import type { StudyMode } from '../hooks/useStudyMode';

export interface ModeSelectorProps {
  currentMode: StudyMode;
  effectiveMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  flipCardCount: number;
  multipleChoiceCount: number;
  isModeSwitchRecommended: boolean;
  className?: string;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  effectiveMode,
  onModeChange,
  flipCardCount,
  multipleChoiceCount,
  isModeSwitchRecommended,
  className = '',
}) => {
  const handleModeSelect = (mode: StudyMode) => {
    if (mode !== currentMode) {
      onModeChange(mode);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent, mode: StudyMode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleModeSelect(mode);
    }
  };

  const isFlipCardActive = currentMode === 'flip-card';
  const isMultipleChoiceActive = currentMode === 'multiple-choice';
  const isFlipCardEffective = effectiveMode === 'flip-card';

  return (
    <div className={`mode-selector ${className}`}>
      <div className="mode-selector-header">
        <h3 className="mode-selector-title">Study Mode</h3>
        {currentMode !== effectiveMode && (
          <div className="mode-switch-indicator">
            <span className="switch-icon">🔄</span>
            <span className="switch-text">Auto-switched to {effectiveMode} mode</span>
          </div>
        )}
        {isModeSwitchRecommended && (
          <div className="mode-recommendation">
            <span className="recommendation-icon">💡</span>
            <span className="recommendation-text">
              This question works better in {isFlipCardEffective ? 'flip card' : 'multiple choice'} mode
            </span>
          </div>
        )}
      </div>

      <div className="mode-options">
        {/* Flip Card Mode Option */}
        <div
          className={`mode-option ${isFlipCardActive ? 'active' : ''} ${flipCardCount === 0 ? 'disabled' : ''}`}
          onClick={() => flipCardCount > 0 && handleModeSelect('flip-card')}
          onKeyDown={(e) => flipCardCount > 0 && handleKeyPress(e, 'flip-card')}
          tabIndex={flipCardCount > 0 ? 0 : -1}
          role="button"
          aria-label={`Flip Card Mode - ${flipCardCount} questions available`}
          aria-pressed={isFlipCardActive}
        >
          <div className="mode-icon">
            <div className="flip-card-icon">
              <div className="card-front">?</div>
              <div className="card-back">A</div>
            </div>
          </div>
          <div className="mode-content">
            <h4 className="mode-name">Flip Card Mode</h4>
            <p className="mode-description">
              Study with traditional revision cards - see question, flip to reveal answer
            </p>
            <div className="mode-stats">
              <span className="question-count">
                {flipCardCount} question{flipCardCount !== 1 ? 's' : ''}
              </span>
              {flipCardCount === 0 && (
                <span className="no-questions">No compatible questions</span>
              )}
            </div>
          </div>
          <div className="mode-status">
            {isFlipCardActive && (
              <div className="status-indicator active">
                <span className="status-icon">✓</span>
                <span className="status-text">Active</span>
              </div>
            )}
            {effectiveMode === 'flip-card' && currentMode !== 'flip-card' && (
              <div className="status-indicator auto-selected">
                <span className="status-icon">🔄</span>
                <span className="status-text">Auto-selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Multiple Choice Mode Option */}
        <div
          className={`mode-option ${isMultipleChoiceActive ? 'active' : ''} ${multipleChoiceCount === 0 ? 'disabled' : ''}`}
          onClick={() => multipleChoiceCount > 0 && handleModeSelect('multiple-choice')}
          onKeyDown={(e) => multipleChoiceCount > 0 && handleKeyPress(e, 'multiple-choice')}
          tabIndex={multipleChoiceCount > 0 ? 0 : -1}
          role="button"
          aria-label={`Multiple Choice Mode - ${multipleChoiceCount} questions available`}
          aria-pressed={isMultipleChoiceActive}
        >
          <div className="mode-icon">
            <div className="mc-icon">
              <div className="mc-question">Q</div>
              <div className="mc-options">
                <div className="mc-option">A</div>
                <div className="mc-option">B</div>
                <div className="mc-option selected">C</div>
                <div className="mc-option">D</div>
              </div>
            </div>
          </div>
          <div className="mode-content">
            <h4 className="mode-name">Multiple Choice</h4>
            <p className="mode-description">
              Test your knowledge with multiple choice questions and instant feedback
            </p>
            <div className="mode-stats">
              <span className="question-count">
                {multipleChoiceCount} question{multipleChoiceCount !== 1 ? 's' : ''}
              </span>
              {multipleChoiceCount === 0 && (
                <span className="no-questions">No compatible questions</span>
              )}
            </div>
          </div>
          <div className="mode-status">
            {isMultipleChoiceActive && (
              <div className="status-indicator active">
                <span className="status-icon">✓</span>
                <span className="status-text">Active</span>
              </div>
            )}
            {effectiveMode === 'multiple-choice' && currentMode !== 'multiple-choice' && (
              <div className="status-indicator auto-selected">
                <span className="status-icon">🔄</span>
                <span className="status-text">Auto-selected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mode-selector-footer">
        <div className="keyboard-hints">
          <span className="hint">Use Tab to navigate • Enter/Space to select</span>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;