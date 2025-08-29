import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RevisionCard } from '../components/cards/RevisionCard';
import { CardActions } from '../components/cards/CardActions';
import { ModeSelector } from '../components/ModeSelector';
import { SimpleFlipCardMode } from '../components/study-modes/SimpleFlipCardMode';
import { SimpleMultipleChoiceMode } from '../components/study-modes/SimpleMultipleChoiceMode';
import { useQuestions } from '../hooks/useQuestions';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useStudyMode } from '../hooks/useStudyMode';
import type { UserProgress, Category } from '../utils/types';
import { isFlipCardQuestion, isMultipleChoiceQuestion } from '../utils/types';
import './Study.css';
import '../components/ModeSelector.css';

export const Study: React.FC = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as Category | null;
  
  const { questions, loading, error } = useQuestions(categoryParam || undefined, categoryParam ? 'variables' : undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useLocalStorage<Record<string, UserProgress>>('study-progress', {});
  
  // Study mode management
  const {
    currentMode,
    effectiveMode,
    compatibleQuestions,
    hasCompatibleQuestions,
    isModeSwitchRecommended,
    changeMode,
    updateSessionProgress,
    getModeSettings,
    sessionStats
  } = useStudyMode(questions);
  
  const studyContainerRef = useRef<HTMLDivElement>(null);
  
  // Use compatible questions for the current mode, fallback to all questions
  const studyQuestions = compatibleQuestions.length > 0 ? compatibleQuestions : questions;
  const currentQuestion = studyQuestions[currentIndex];
  
  // Count questions by type for mode selector
  const flipCardQuestions = questions.filter(isFlipCardQuestion);
  const multipleChoiceQuestions = questions.filter(isMultipleChoiceQuestion);

  const handleNext = () => {
    if (currentIndex < studyQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };
  
  // Handle mode change and reset to first question
  const handleModeChange = (newMode: 'flip-card' | 'multiple-choice') => {
    changeMode(newMode);
    setCurrentIndex(0); // Reset to first question when changing modes
    setIsFlipped(false);
  };

  // Use swipe gestures for navigation
  useSwipeGesture(studyContainerRef, {
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
  });

  const handleKnown = () => {
    if (!currentQuestion) return;
    
    const questionProgress = progress[currentQuestion.id] || {
      questionId: currentQuestion.id,
      knownCount: 0,
      unknownCount: 0,
      lastStudied: new Date().toISOString(),
      difficulty: currentQuestion.difficulty,
      consecutiveCorrect: 0,
      averageTime: 0,
      isFavorite: false
    };

    setProgress({
      ...progress,
      [currentQuestion.id]: {
        ...questionProgress,
        knownCount: questionProgress.knownCount + 1,
        consecutiveCorrect: questionProgress.consecutiveCorrect + 1,
        lastStudied: new Date().toISOString()
      }
    });

    // Update session progress
    updateSessionProgress({
      questionsAnswered: sessionStats.questionsAnswered + 1,
      correctAnswers: sessionStats.correctAnswers + 1, // Known counts as correct for flip cards
    });
    
    setTimeout(handleNext, 500);
  };

  const handleUnknown = () => {
    if (!currentQuestion) return;
    
    const questionProgress = progress[currentQuestion.id] || {
      questionId: currentQuestion.id,
      knownCount: 0,
      unknownCount: 0,
      lastStudied: new Date().toISOString(),
      difficulty: currentQuestion.difficulty,
      consecutiveCorrect: 0,
      averageTime: 0,
      isFavorite: false
    };

    setProgress({
      ...progress,
      [currentQuestion.id]: {
        ...questionProgress,
        unknownCount: questionProgress.unknownCount + 1,
        consecutiveCorrect: 0,
        lastStudied: new Date().toISOString()
      }
    });

    // Update session progress - unknown doesn't count as correct
    updateSessionProgress({
      questionsAnswered: sessionStats.questionsAnswered + 1,
      correctAnswers: sessionStats.correctAnswers, // Don't increment for unknown
    });
    
    setTimeout(handleNext, 500);
  };

  if (loading) {
    return (
      <div className="study-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="study-page">
        <div className="error-container">
          <h2>Error Loading Questions</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="study-page">
        <div className="empty-container">
          <h2>No Questions Available</h2>
          <p>This category doesn't have any questions yet.</p>
        </div>
      </div>
    );
  }
  
  // Show mode selector if no compatible questions for current mode
  if (!hasCompatibleQuestions) {
    return (
      <div className="study-page">
        <div className="study-container">
          <div className="study-header">
            <h1>Study Mode</h1>
            <div className="study-stats">
              <span className="stat">{categoryParam || 'All Categories'}</span>
            </div>
          </div>
          
          <ModeSelector
            currentMode={currentMode}
            effectiveMode={effectiveMode}
            onModeChange={handleModeChange}
            flipCardCount={flipCardQuestions.length}
            multipleChoiceCount={multipleChoiceQuestions.length}
            isModeSwitchRecommended={isModeSwitchRecommended}
          />
          
          <div className="empty-container">
            <h2>No Compatible Questions</h2>
            <p>There are no {currentMode === 'flip-card' ? 'flip card' : 'multiple choice'} questions in this category.</p>
            <p>Please select a different study mode above.</p>
          </div>
        </div>
      </div>
    );
  }

  // Render the appropriate study mode component
  const renderStudyMode = () => {
    if (!currentQuestion) return null;
    
    const modeProps = {
      questions: studyQuestions,
      currentIndex,
      onNext: handleNext,
      onPrevious: handlePrevious,
    };
    
    if (effectiveMode === 'flip-card' && isFlipCardQuestion(currentQuestion)) {
      const settings = getModeSettings('flip-card') as {
        autoFlipDelay?: number;
        allowAnswerBeforeFlip: boolean;
      };
      return (
        <SimpleFlipCardMode
          {...modeProps}
          onKnown={handleKnown}
          onUnknown={handleUnknown}
          autoFlipDelay={settings.autoFlipDelay}
          allowAnswerBeforeFlip={settings.allowAnswerBeforeFlip}
        />
      );
    } else if (effectiveMode === 'multiple-choice' && isMultipleChoiceQuestion(currentQuestion)) {
      const settings = getModeSettings('multiple-choice') as {
        showExplanationOnIncorrect: boolean;
        allowRetry: boolean;
      };
      return (
        <SimpleMultipleChoiceMode
          {...modeProps}
          onAnswerSubmitted={(isCorrect) => {
            // Update session progress
            updateSessionProgress({
              questionsAnswered: sessionStats.questionsAnswered + 1,
              correctAnswers: sessionStats.correctAnswers + (isCorrect ? 1 : 0),
            });
            
            // Auto-advance after a short delay
            setTimeout(handleNext, 1500);
          }}
          showExplanationOnIncorrect={settings.showExplanationOnIncorrect}
          allowRetry={settings.allowRetry}
        />
      );
    }
    
    // Fallback to revision card for incompatible questions
    return (
      <>
        <RevisionCard
          question={currentQuestion}
          onKnown={handleKnown}
          onUnknown={handleUnknown}
          onNext={handleNext}
        />
        
        <CardActions
          onKnown={handleKnown}
          onUnknown={handleUnknown}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canGoPrevious={currentIndex > 0}
          canGoNext={currentIndex < studyQuestions.length - 1}
          isFlipped={isFlipped}
        />
      </>
    );
  };

  return (
    <div className="study-page" ref={studyContainerRef}>
      <div className="study-container">
        <div className="study-header">
          <h1>Study Mode</h1>
          <div className="study-stats">
            <span className="stat">Question {currentIndex + 1} of {studyQuestions.length}</span>
            <span className="stat">{categoryParam || 'All Categories'}</span>
            <span className="stat">{effectiveMode === 'flip-card' ? 'Flip Cards' : 'Multiple Choice'}</span>
          </div>
        </div>

        <ModeSelector
          currentMode={currentMode}
          effectiveMode={effectiveMode}
          onModeChange={handleModeChange}
          flipCardCount={flipCardQuestions.length}
          multipleChoiceCount={multipleChoiceQuestions.length}
          isModeSwitchRecommended={isModeSwitchRecommended}
        />

        {renderStudyMode()}

        {currentIndex === studyQuestions.length - 1 && (
          <div className="completion-message">
            <h2>🎉 Great job!</h2>
            <p>You've completed all {effectiveMode === 'flip-card' ? 'flip card' : 'multiple choice'} questions in this session.</p>
            <div className="session-stats">
              <p>Questions answered: {sessionStats.questionsAnswered}</p>
              <p>Accuracy: {sessionStats.accuracy.toFixed(1)}%</p>
              <p>Time: {sessionStats.duration} minutes</p>
            </div>
          </div>
        )}
        
        <div className="swipe-hint">
          <span>← Swipe for next/previous →</span>
        </div>
      </div>
    </div>
  );
};