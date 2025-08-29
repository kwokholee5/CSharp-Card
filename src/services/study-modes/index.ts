// Public API exports for study mode services
// Follows SOLID principles by exposing abstractions, not implementations

// Core interfaces
export type { 
  IAnswerValidator, 
  IProgressAwareValidator,
  IValidatorFactory,
  ValidationResult, 
  AnswerSubmission 
} from './IAnswerValidator';

export type { 
  IProgressTracker, 
  IProgressObserver, 
  ProgressUpdate, 
  StudyMetrics 
} from './IProgressTracker';

// Concrete implementations
export { FlipCardValidator } from './FlipCardValidator';
export { MultipleChoiceValidator } from './MultipleChoiceValidator';
export { ValidatorFactory, CompositeValidator, validatorFactory } from './ValidatorFactory';
export { LocalStorageProgressTracker } from './LocalStorageProgressTracker';

// Note: IValidatorFactory is already exported above from IAnswerValidator