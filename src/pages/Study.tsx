import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RevisionCard } from '../components/cards/RevisionCard';
import { CardActions } from '../components/cards/CardActions';
import { useQuestions } from '../hooks/useQuestions';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { UserProgress, Category } from '../utils/types';
import './Study.css';

export const Study: React.FC = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as Category | null;
  
  const { questions, loading, error } = useQuestions(categoryParam || undefined, categoryParam ? 'variables' : undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useLocalStorage<Record<string, UserProgress>>('study-progress', {});

  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
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

  return (
    <div className="study-page">
      <div className="study-container">
        <div className="study-header">
          <h1>Study Mode</h1>
          <div className="study-stats">
            <span className="stat">Question {currentIndex + 1} of {questions.length}</span>
            <span className="stat">{categoryParam || 'All Categories'}</span>
          </div>
        </div>

        {currentQuestion && (
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
              canGoNext={currentIndex < questions.length - 1}
              isFlipped={isFlipped}
            />
          </>
        )}

        {currentIndex === questions.length - 1 && (
          <div className="completion-message">
            <h2>🎉 Great job!</h2>
            <p>You've completed all questions in this session.</p>
          </div>
        )}
      </div>
    </div>
  );
};