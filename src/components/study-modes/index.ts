// Public API exports for study mode components
// Following SOLID principles with clean interfaces

// Core abstractions
export { AbstractStudyMode } from './AbstractStudyMode';
export type { StudyModeProps, StudyModeState } from './AbstractStudyMode';

// Concrete implementations
export { MultipleChoiceMode } from './MultipleChoiceMode';
export type { MultipleChoiceProps } from './MultipleChoiceMode';

export { FlipCardMode } from './FlipCardMode';
export type { FlipCardProps } from './FlipCardMode';

// Factory patterns
export type { IStudyModeFactory, StudyModeConfig } from './StudyModeFactory';
export { 
  StudyModeFactory, 
  studyModeFactory, 
  createStudyModeWithDI 
} from './StudyModeFactory';

// Re-export service types that components need
export type { 
  ValidationResult, 
  AnswerSubmission 
} from '../../services/study-modes/IAnswerValidator';

export type { 
  StudyMetrics 
} from '../../services/study-modes/IProgressTracker';