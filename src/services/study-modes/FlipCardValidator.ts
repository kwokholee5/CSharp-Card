// Concrete implementation of IAnswerValidator for flip card questions
// Strategy Pattern implementation

import type { Question, FlipCardQuestion } from '../../utils/types';
import type { 
  IAnswerValidator, 
  ValidationResult, 
  AnswerSubmission 
} from './IAnswerValidator';
import { isFlipCardQuestion } from '../../utils/types';

export class FlipCardValidator implements IAnswerValidator {
  
  /**
   * Validates flip card answers - user indicates known/unknown
   */
  public validateAnswer(question: Question, submission: AnswerSubmission): ValidationResult {
    if (!this.canValidate(question)) {
      throw new Error(`FlipCardValidator cannot validate question type: ${question.type}`);
    }

    const flipCardQuestion = question as FlipCardQuestion;
    const userResponse = submission.userAnswer as { isKnown: boolean };

    if (typeof userResponse?.isKnown !== 'boolean') {
      throw new Error('Invalid submission format for flip card question');
    }

    // For flip cards, the user self-assesses their knowledge
    // Score is binary: 1 for known, 0 for unknown
    const score = userResponse.isKnown ? 1 : 0;
    
    // Calculate time penalty for very quick responses (likely guessing)
    const minThinkTime = 2000; // 2 seconds minimum
    const timePenalty = submission.timeSpent < minThinkTime ? 0.1 : 0;

    const finalScore = Math.max(0, score - timePenalty);

    return {
      isCorrect: userResponse.isKnown,
      score: finalScore,
      feedback: userResponse.isKnown 
        ? 'Great! You knew this answer.' 
        : 'Keep studying - you\'ll get it next time!',
      explanation: flipCardQuestion.explanation,
      timePenalty: timePenalty > 0 ? timePenalty : undefined
    };
  }

  /**
   * Maximum score for flip card is always 1
   */
  public getMaxScore(question: Question): number {
    if (!this.canValidate(question)) {
      throw new Error(`FlipCardValidator cannot score question type: ${question.type}`);
    }
    return 1;
  }

  /**
   * Can only validate flip card questions
   */
  public canValidate(question: Question): boolean {
    return isFlipCardQuestion(question);
  }
}