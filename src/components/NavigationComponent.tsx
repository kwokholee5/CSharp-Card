import React from 'react';
import type { IQuestionManager } from '../interfaces/services/IQuestionManager';
import type { IAnswerManager } from '../interfaces/services/IAnswerManager';
import './NavigationComponent.css';

/**
 * Props interface for NavigationComponent following Interface Segregation Principle
 */
export interface NavigationComponentProps {
  /** Question manager for handling question navigation */
  questionManager: IQuestionManager;
  
  /** Answer manager for handling answer state reset */
  answerManager: IAnswerManager;
  
  /** Callback when question is reset/redone */
  onQuestionReset?: () => void;
  
  /** Callback when moving to next question */
  onNextQuestion?: () => void;
  
  /** Optional CSS class name for styling */
  className?: string;
  
  /** Optional callback when component encounters an error */
  onError?: (error: Error) => void;
}

/**
 * React component for question navigation controls.
 * Follows Single Responsibility Principle by focusing only on navigation actions.
 * Provides "Redo Question" and "Next Question" functionality.
 */
export const NavigationComponent: React.FC<NavigationComponentProps> = ({
  questionManager,
  answerManager,
  onQuestionReset,
  onNextQuestion,
  className = '',
  onError
}) => {
  const [isResetting, setIsResetting] = React.useState<boolean>(false);
  const [isNavigating, setIsNavigating] = React.useState<boolean>(false);

  /**
   * Handles the "Redo Question" action
   */
  const handleRedoQuestion = React.useCallback(() => {
    if (isResetting || isNavigating) {
      return;
    }

    try {
      setIsResetting(true);
      
      const currentQuestion = questionManager.getCurrentQuestion();
      if (!currentQuestion) {
        throw new Error('No current question available to reset');
      }

      // Reset the answer state for the current question
      answerManager.resetAnswer(currentQuestion.id);
      
      // Reset the question manager's current question state
      questionManager.resetCurrent();
      
      if (onQuestionReset) {
        onQuestionReset();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reset question');
      if (onError) {
        onError(error);
      }
    } finally {
      setIsResetting(false);
    }
  }, [questionManager, answerManager, onQuestionReset, onError, isResetting, isNavigating]);

  /**
   * Handles the "Next Question" action
   */
  const handleNextQuestion = React.useCallback(() => {
    if (isNavigating || isResetting) {
      return;
    }

    try {
      setIsNavigating(true);
      
      const moved = questionManager.moveToNext();
      
      if (!moved) {
        // Could be at the end of questions - this is not necessarily an error
      }
      
      if (onNextQuestion) {
        onNextQuestion();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to move to next question');
      if (onError) {
        onError(error);
      }
    } finally {
      setIsNavigating(false);
    }
  }, [questionManager, onNextQuestion, onError, isNavigating, isResetting]);

  /**
   * Gets the current question information for button states
   */
  const getQuestionInfo = React.useMemo(() => {
    try {
      const currentQuestion = questionManager.getCurrentQuestion();
      const currentIndex = questionManager.getCurrentIndex();
      const totalCount = questionManager.getTotalCount();
      const isLastQuestion = currentIndex >= totalCount - 1;
      
      return {
        hasCurrentQuestion: currentQuestion !== null,
        isLastQuestion,
        currentIndex: currentIndex + 1, // Convert to 1-based for display
        totalCount
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get question information');
      if (onError) {
        onError(error);
      }
      
      return {
        hasCurrentQuestion: false,
        isLastQuestion: true,
        currentIndex: 0,
        totalCount: 0
      };
    }
  }, [questionManager, onError]);

  /**
   * Renders the redo question button
   */
  const renderRedoButton = (): React.ReactElement => {
    const canRedo = getQuestionInfo.hasCurrentQuestion && !isResetting && !isNavigating;
    
    return (
      <button
        className={`navigation-button navigation-button--redo ${canRedo ? 'navigation-button--enabled' : 'navigation-button--disabled'}`}
        onClick={handleRedoQuestion}
        disabled={!canRedo}
        aria-label="Reset current question to try again"
        aria-describedby="redo-button-description"
      >
        <span className="navigation-button-icon">↻</span>
        <span className="navigation-button-text">
          {isResetting ? 'Resetting...' : 'Redo Question'}
        </span>
      </button>
    );
  };

  /**
   * Renders the next question button
   */
  const renderNextButton = (): React.ReactElement => {
    const canMoveNext = getQuestionInfo.hasCurrentQuestion && !getQuestionInfo.isLastQuestion && !isNavigating && !isResetting;
    
    return (
      <button
        className={`navigation-button navigation-button--next ${canMoveNext ? 'navigation-button--enabled' : 'navigation-button--disabled'}`}
        onClick={handleNextQuestion}
        disabled={!canMoveNext}
        aria-label={getQuestionInfo.isLastQuestion ? 'No more questions available' : 'Move to next question'}
        aria-describedby="next-button-description"
      >
        <span className="navigation-button-text">
          {isNavigating ? 'Loading...' : getQuestionInfo.isLastQuestion ? 'Last Question' : 'Next Question'}
        </span>
        <span className="navigation-button-icon">→</span>
      </button>
    );
  };

  /**
   * Renders the question progress indicator
   */
  const renderProgressIndicator = (): React.ReactElement => {
    if (!getQuestionInfo.hasCurrentQuestion) {
      return (
        <div className="navigation-progress">
          <span className="navigation-progress-text">No questions loaded</span>
        </div>
      );
    }

    return (
      <div className="navigation-progress">
        <span className="navigation-progress-text">
          Question {getQuestionInfo.currentIndex} of {getQuestionInfo.totalCount}
        </span>
        <div className="navigation-progress-bar">
          <div 
            className="navigation-progress-fill"
            style={{ 
              width: `${(getQuestionInfo.currentIndex / getQuestionInfo.totalCount) * 100}%` 
            }}
            aria-label={`Progress: ${getQuestionInfo.currentIndex} of ${getQuestionInfo.totalCount} questions`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`navigation-component ${className}`}>
      <div className="navigation-component-content">
        {renderProgressIndicator()}
        
        <div className="navigation-buttons">
          {renderRedoButton()}
          {renderNextButton()}
        </div>
        
        {/* Hidden descriptions for accessibility */}
        <div id="redo-button-description" className="sr-only">
          Reset the current question to its initial state and clear your answer
        </div>
        <div id="next-button-description" className="sr-only">
          {getQuestionInfo.isLastQuestion 
            ? 'You have reached the last question in the set'
            : 'Move to the next question in the sequence'
          }
        </div>
      </div>
    </div>
  );
};

export default NavigationComponent;