// Custom hook for managing study mode state and user preferences
// Provides persistent storage of mode selection and study session state

import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Question } from '../utils/types';
import { isFlipCardQuestion, isMultipleChoiceQuestion } from '../utils/types';

export type StudyMode = 'flip-card' | 'multiple-choice';

export interface StudyModePreferences {
  defaultMode: StudyMode;
  autoSwitchByQuestionType: boolean; // Auto-switch to appropriate mode based on question type
  flipCardSettings: {
    autoFlipDelay?: number;
    allowAnswerBeforeFlip: boolean;
  };
  multipleChoiceSettings: {
    showExplanationOnIncorrect: boolean;
    allowRetry: boolean;
  };
}

export interface StudySession {
  selectedMode: StudyMode;
  currentQuestionIndex: number;
  sessionStartTime: Date;
  questionsAnswered: number;
  correctAnswers: number;
  modeSwitchCount: number;
}

const DEFAULT_PREFERENCES: StudyModePreferences = {
  defaultMode: 'flip-card',
  autoSwitchByQuestionType: false,
  flipCardSettings: {
    autoFlipDelay: undefined, // No auto-flip by default
    allowAnswerBeforeFlip: false,
  },
  multipleChoiceSettings: {
    showExplanationOnIncorrect: true,
    allowRetry: false,
  },
};

const DEFAULT_SESSION: Omit<StudySession, 'sessionStartTime'> = {
  selectedMode: 'flip-card',
  currentQuestionIndex: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  modeSwitchCount: 0,
};

export function useStudyMode(questions: Question[] = []) {
  // Persistent preferences stored in localStorage
  const [preferences, setPreferences] = useLocalStorage<StudyModePreferences>(
    'study-mode-preferences',
    DEFAULT_PREFERENCES
  );

  // Session state (not persisted - resets on page refresh)
  const [session, setSession] = useState<StudySession>(() => ({
    ...DEFAULT_SESSION,
    selectedMode: preferences.defaultMode,
    sessionStartTime: new Date(),
  }));

  // Get the optimal mode for the current question
  const getOptimalModeForQuestion = useCallback((question: Question): StudyMode => {
    if (isFlipCardQuestion(question)) {
      return 'flip-card';
    } else if (isMultipleChoiceQuestion(question)) {
      return 'multiple-choice';
    }
    // Fallback to current mode if question type is unknown
    return session.selectedMode;
  }, [session.selectedMode]);

  // Get questions that are compatible with the current mode
  const compatibleQuestions = useMemo(() => {
    if (!questions.length) return [];
    
    return questions.filter(question => {
      if (session.selectedMode === 'flip-card') {
        return isFlipCardQuestion(question);
      } else {
        return isMultipleChoiceQuestion(question);
      }
    });
  }, [questions, session.selectedMode]);

  // Get the effective mode (considering auto-switch preferences)
  const effectiveMode = useMemo(() => {
    if (!preferences.autoSwitchByQuestionType || !questions.length) {
      return session.selectedMode;
    }

    const currentQuestion = questions[session.currentQuestionIndex];
    if (currentQuestion) {
      return getOptimalModeForQuestion(currentQuestion);
    }

    return session.selectedMode;
  }, [
    preferences.autoSwitchByQuestionType,
    session.selectedMode,
    session.currentQuestionIndex,
    questions,
    getOptimalModeForQuestion,
  ]);

  // Check if current mode has compatible questions
  const hasCompatibleQuestions = compatibleQuestions.length > 0;

  // Check if a mode switch is recommended for the current question
  const isModeSwitchRecommended = useMemo(() => {
    if (!questions.length || preferences.autoSwitchByQuestionType) {
      return false;
    }

    const currentQuestion = questions[session.currentQuestionIndex];
    if (!currentQuestion) return false;

    const optimalMode = getOptimalModeForQuestion(currentQuestion);
    return optimalMode !== session.selectedMode;
  }, [
    questions,
    session.currentQuestionIndex,
    session.selectedMode,
    preferences.autoSwitchByQuestionType,
    getOptimalModeForQuestion,
  ]);

  // Change study mode
  const changeMode = useCallback((newMode: StudyMode) => {
    setSession(prev => ({
      ...prev,
      selectedMode: newMode,
      modeSwitchCount: prev.selectedMode !== newMode ? prev.modeSwitchCount + 1 : prev.modeSwitchCount,
    }));
  }, []);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<StudyModePreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
    }));
  }, [setPreferences]);

  // Update session progress
  const updateSessionProgress = useCallback((updates: Partial<Omit<StudySession, 'sessionStartTime' | 'selectedMode'>>) => {
    setSession(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Reset session (useful when starting a new study session)
  const resetSession = useCallback((newMode?: StudyMode) => {
    setSession({
      ...DEFAULT_SESSION,
      selectedMode: newMode || preferences.defaultMode,
      sessionStartTime: new Date(),
    });
  }, [preferences.defaultMode]);

  // Get mode-specific settings
  const getModeSettings = useCallback((mode: StudyMode) => {
    if (mode === 'flip-card') {
      return preferences.flipCardSettings;
    } else {
      return preferences.multipleChoiceSettings;
    }
  }, [preferences]);

  // Calculate session statistics
  const sessionStats = useMemo(() => {
    const sessionDurationMs = Date.now() - session.sessionStartTime.getTime();
    const sessionDurationMinutes = Math.round(sessionDurationMs / 60000);
    
    return {
      duration: sessionDurationMinutes,
      questionsAnswered: session.questionsAnswered,
      correctAnswers: session.correctAnswers,
      accuracy: session.questionsAnswered > 0 ? (session.correctAnswers / session.questionsAnswered) * 100 : 0,
      modeSwitchCount: session.modeSwitchCount,
      currentMode: effectiveMode,
    };
  }, [session, effectiveMode]);

  return {
    // Current state
    currentMode: session.selectedMode,
    effectiveMode,
    preferences,
    session,
    
    // Question compatibility
    compatibleQuestions,
    hasCompatibleQuestions,
    isModeSwitchRecommended,
    
    // Actions
    changeMode,
    updatePreferences,
    updateSessionProgress,
    resetSession,
    
    // Helpers
    getModeSettings,
    getOptimalModeForQuestion,
    
    // Statistics
    sessionStats,
  };
}

export default useStudyMode;