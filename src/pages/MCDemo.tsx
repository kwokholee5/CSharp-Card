// Demo page to showcase Multiple Choice Mode implementation
// This demonstrates the Phase 4 concrete implementations

import React, { useState, useEffect } from 'react';
import { MultipleChoiceMode } from '../components/study-modes/MultipleChoiceMode';
import { ValidatorFactory } from '../services/study-modes/ValidatorFactory';
import { LocalStorageProgressTracker } from '../services/study-modes/LocalStorageProgressTracker';
import type { Question, MultipleChoiceQuestion } from '../utils/types';
import type { StudyMetrics } from '../services/study-modes/IProgressTracker';

// Import the study mode registration to ensure modes are registered
import '../components/study-modes/studyModeRegistration';

const MCDemo: React.FC = () => {
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize validator and progress tracker
  const validator = new ValidatorFactory().createValidator('multiple-choice');
  const progressTracker = new LocalStorageProgressTracker();
  const sessionId = `mc-demo-${Date.now()}`;

  useEffect(() => {
    const loadMCQuestions = async () => {
      try {
        // Load the MC questions from data file
        const response = await fetch('/data/questions/basics/data-types-mc.json');
        if (!response.ok) {
          throw new Error('Failed to load MC questions');
        }
        
        const data = await response.json();
        const mcQuestions = data.questions.filter((q: Question) => q.type === 'multiple-choice');
        
        if (mcQuestions.length === 0) {
          throw new Error('No multiple choice questions found');
        }
        
        setQuestions(mcQuestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadMCQuestions();
  }, []);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSessionEnd = (_metrics: StudyMetrics) => {
    // In a real app, you might save these metrics or show a summary
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontSize: '1.2rem'
      }}>
        Loading Multiple Choice Demo...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Error Loading Demo</h2>
        <p style={{ color: '#666' }}>{error}</p>
        <p style={{ color: '#666', marginTop: '1rem' }}>
          Make sure the data files are available at /public/data/questions/basics/
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontSize: '1.2rem'
      }}>
        No Multiple Choice questions available.
      </div>
    );
  }

  if (!validator) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontSize: '1.2rem',
        color: '#dc3545'
      }}>
        Multiple Choice validator not available.
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ 
        padding: '1rem',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.9)',
        marginBottom: '1rem'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>
          Multiple Choice Mode Demo
        </h1>
        <p style={{ margin: '0.5rem 0', color: '#666' }}>
          Phase 4 Implementation - Concrete Multiple Choice Components
        </p>
      </div>

      <MultipleChoiceMode
        questions={questions}
        currentIndex={currentIndex}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSessionEnd={handleSessionEnd}
        validator={validator}
        progressTracker={progressTracker}
        sessionId={sessionId}
        showExplanationOnIncorrect={true}
        allowRetry={false}
      />
    </div>
  );
};

export default MCDemo;