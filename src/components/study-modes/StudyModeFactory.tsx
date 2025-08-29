// Abstract Factory Pattern for creating study mode components
// Open/Closed Principle - extensible without modification

import React from 'react';
import type { Question } from '../../utils/types';
import type { StudyModeProps } from './AbstractStudyMode';
import type { IAnswerValidator } from '../../services/study-modes/IAnswerValidator';
import type { IProgressTracker } from '../../services/study-modes/IProgressTracker';

// Factory interface for creating study mode components
export interface IStudyModeFactory {
  /**
   * Creates a study mode component for the given question type
   * @param questionType The type of questions this mode will handle
   * @param props Props to pass to the study mode component
   * @returns React component or null if unsupported
   */
  createStudyMode(
    questionType: Question['type'],
    props: StudyModeProps
  ): React.ComponentType<StudyModeProps> | null;

  /**
   * Gets all supported question types
   * @returns Array of supported question type strings
   */
  getSupportedTypes(): Question['type'][];

  /**
   * Checks if a question type is supported
   * @param questionType The question type to check
   * @returns True if supported
   */
  isSupported(questionType: Question['type']): boolean;
}

// Configuration for study mode creation
export interface StudyModeConfig {
  name: string;
  description: string;
  icon?: string;
  supportedQuestionTypes: Question['type'][];
  defaultProps?: Partial<StudyModeProps>;
}

// Registry entry for study modes
interface StudyModeEntry {
  config: StudyModeConfig;
  factory: (props: StudyModeProps) => React.ComponentType<StudyModeProps>;
}

/**
 * Concrete factory for creating study mode components
 * Implements Abstract Factory pattern
 */
export class StudyModeFactory implements IStudyModeFactory {
  private modes: Map<Question['type'], StudyModeEntry>;
  private defaultMode: Question['type'] | null = null;

  constructor() {
    this.modes = new Map();
  }

  /**
   * Creates a study mode component for the given question type
   */
  public createStudyMode(
    questionType: Question['type'],
    props: StudyModeProps
  ): React.ComponentType<StudyModeProps> | null {
    const entry = this.modes.get(questionType);
    if (!entry) {
      return null;
    }

    // Merge default props if any
    const finalProps = entry.config.defaultProps 
      ? { ...entry.config.defaultProps, ...props }
      : props;

    return entry.factory(finalProps);
  }

  /**
   * Gets all supported question types
   */
  public getSupportedTypes(): Question['type'][] {
    const types = new Set<Question['type']>();
    
    for (const entry of this.modes.values()) {
      entry.config.supportedQuestionTypes.forEach(type => types.add(type));
    }
    
    return Array.from(types);
  }

  /**
   * Checks if a question type is supported
   */
  public isSupported(questionType: Question['type']): boolean {
    return this.modes.has(questionType);
  }

  /**
   * Registers a new study mode
   * @param questionType The question type this mode handles
   * @param config Configuration for the study mode
   * @param factory Factory function to create the component
   */
  public registerMode(
    questionType: Question['type'],
    config: StudyModeConfig,
    factory: (props: StudyModeProps) => React.ComponentType<StudyModeProps>
  ): void {
    this.modes.set(questionType, { config, factory });
  }

  /**
   * Unregisters a study mode
   */
  public unregisterMode(questionType: Question['type']): boolean {
    return this.modes.delete(questionType);
  }

  /**
   * Sets the default study mode for unsupported question types
   */
  public setDefaultMode(questionType: Question['type']): void {
    if (this.modes.has(questionType)) {
      this.defaultMode = questionType;
    } else {
      throw new Error(`Cannot set default to unsupported mode: ${questionType}`);
    }
  }

  /**
   * Gets configuration for a study mode
   */
  public getModeConfig(questionType: Question['type']): StudyModeConfig | null {
    const entry = this.modes.get(questionType);
    return entry ? entry.config : null;
  }

  /**
   * Gets all registered study mode configurations
   */
  public getAllModeConfigs(): Map<Question['type'], StudyModeConfig> {
    const configs = new Map<Question['type'], StudyModeConfig>();
    
    for (const [type, entry] of this.modes) {
      configs.set(type, entry.config);
    }
    
    return configs;
  }

  /**
   * Creates the best study mode for a collection of questions
   * Analyzes question types and returns the most appropriate mode
   */
  public createOptimalMode(
    questions: Question[],
    props: StudyModeProps
  ): React.ComponentType<StudyModeProps> | null {
    if (questions.length === 0) {
      return null;
    }

    // Get unique question types
    const questionTypes = [...new Set(questions.map(q => q.type))];

    // If all questions are the same type, use specific mode
    if (questionTypes.length === 1) {
      return this.createStudyMode(questionTypes[0], props);
    }

    // Multiple types - try to find a mode that supports multiple types
    for (const [type, entry] of this.modes) {
      const supportedTypes = new Set(entry.config.supportedQuestionTypes);
      const allSupported = questionTypes.every(qType => supportedTypes.has(qType));
      
      if (allSupported) {
        return this.createStudyMode(type, props);
      }
    }

    // No single mode supports all types - use default or first available
    return this.defaultMode ? this.createStudyMode(this.defaultMode, props) : null;
  }

  /**
   * Creates a study mode selector component that can switch between modes
   */
  public createModeSelector(
    questions: Question[],
    props: StudyModeProps
  ): React.ComponentType<StudyModeProps & { onModeChange: (mode: Question['type']) => void }> {
    const availableTypes = [...new Set(questions.map(q => q.type))];
    const supportedModes = availableTypes.filter(type => this.isSupported(type));

    const factory = this;
    return class StudyModeSelector extends React.Component<
      StudyModeProps & { onModeChange: (mode: Question['type']) => void }
    > {
      render() {
        const { onModeChange, ...studyProps } = this.props;
        const currentType = questions[props.currentIndex]?.type;
        const CurrentMode = factory.createStudyMode(currentType, studyProps);

        if (!CurrentMode) {
          return <div>No study mode available for this question type</div>;
        }

        return (
          <div className="study-mode-selector">
            {supportedModes.length > 1 && (
              <div className="mode-switcher">
                {supportedModes.map(mode => (
                  <button
                    key={mode}
                    onClick={() => onModeChange(mode)}
                    className={currentType === mode ? 'active' : ''}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
            <CurrentMode {...studyProps} />
          </div>
        );
      }
    };
  }
}

// Utility function to create a study mode with dependency injection
export function createStudyModeWithDI(
  questionType: Question['type'],
  questions: Question[],
  currentIndex: number,
  validator: IAnswerValidator,
  progressTracker: IProgressTracker,
  sessionId: string,
  onNext: () => void,
  onPrevious: () => void,
  onSessionEnd: (metrics: any) => void
): React.ComponentType<{}> | null {
  const factory = studyModeFactory;
  
  const props: StudyModeProps = {
    questions,
    currentIndex,
    onNext,
    onPrevious,
    onSessionEnd,
    validator,
    progressTracker,
    sessionId
  };

  const StudyModeComponent = factory.createStudyMode(questionType, props);
  
  if (!StudyModeComponent) {
    return null;
  }

  // Return a component that doesn't need additional props
  return function StudyModeWrapper() {
    return React.createElement(StudyModeComponent, props);
  };
}

// Singleton factory instance
export const studyModeFactory = new StudyModeFactory();