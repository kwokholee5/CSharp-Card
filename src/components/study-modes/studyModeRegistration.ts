// Study Mode Registration - Registers concrete implementations with the factory
// Follows Open/Closed Principle - new modes can be added without modifying core factory

import React from 'react';
import type { StudyModeProps } from './AbstractStudyMode';
import { studyModeFactory } from './StudyModeFactory';
import { MultipleChoiceMode } from './MultipleChoiceMode';
import { FlipCardMode } from './FlipCardMode';

// Import styles
import './StudyModes.css';

/**
 * Register Multiple Choice Mode
 */
studyModeFactory.registerMode(
  'multiple-choice',
  {
    name: 'Multiple Choice',
    description: 'Interactive multiple choice questions with instant feedback',
    icon: '☑️',
    supportedQuestionTypes: ['multiple-choice'],
    defaultProps: {
      // Default props for Multiple Choice mode
      // These can be overridden when creating the component
    }
  },
  (_props: StudyModeProps) => {
    // Factory function returns the component class
    return MultipleChoiceMode as React.ComponentType<StudyModeProps>;
  }
);

/**
 * Register Flip Card Mode
 */
studyModeFactory.registerMode(
  'flip-card',
  {
    name: 'Flip Cards',
    description: 'Traditional flip card study method for memorization',
    icon: '🔄',
    supportedQuestionTypes: ['flip-card'],
    defaultProps: {
      // Default props for Flip Card mode - empty for now since these aren't in base StudyModeProps
    }
  },
  (_props: StudyModeProps) => {
    // Factory function returns the component class
    return FlipCardMode as React.ComponentType<StudyModeProps>;
  }
);

// Set flip-card as the default mode for backward compatibility
studyModeFactory.setDefaultMode('flip-card');

/**
 * Helper function to get available study modes for UI
 */
export function getAvailableStudyModes() {
  return studyModeFactory.getAllModeConfigs();
}

/**
 * Helper function to get the best study mode for a set of questions
 */
export function getBestStudyModeForQuestions(questions: any[]) {
  if (questions.length === 0) return null;
  
  const questionTypes = [...new Set(questions.map(q => q.type))];
  
  // If all questions are the same type, return that type
  if (questionTypes.length === 1) {
    return questionTypes[0];
  }
  
  // Mixed types - for now return flip-card as default
  // Future enhancement: create a unified mode for mixed question types
  return 'flip-card';
}

/**
 * Validation helper - checks if questions are compatible with study mode
 */
export function validateQuestionsForMode(questions: any[], modeType: string): boolean {
  const modeConfig = studyModeFactory.getModeConfig(modeType as any);
  if (!modeConfig) return false;
  
  const supportedTypes = new Set(modeConfig.supportedQuestionTypes);
  return questions.every(q => supportedTypes.has(q.type));
}

/**
 * Export the configured factory instance
 */
export { studyModeFactory };

/**
 * Type exports for convenience
 */
export type { StudyModeConfig } from './StudyModeFactory';