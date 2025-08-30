/**
 * Component exports for the application
 * Organized following OOP principles and SOLID design
 */

// Core UI Components
export { QuestionComponent } from './QuestionComponent';
export type { QuestionComponentProps } from './QuestionComponent';

export { AnswerComponent } from './AnswerComponent';
export type { AnswerComponentProps } from './AnswerComponent';

export { ExplanationComponent } from './ExplanationComponent';
export type { ExplanationComponentProps } from './ExplanationComponent';

export { NavigationComponent } from './NavigationComponent';
export type { NavigationComponentProps } from './NavigationComponent';

// Card Components (presentation-first)
export * from './cards';

// Study Mode Components (with factories/registrations)
export * from './study-modes';