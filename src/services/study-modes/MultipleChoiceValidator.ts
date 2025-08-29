// Concrete implementation of IAnswerValidator for multiple choice questions
// Strategy Pattern implementation

import type { Question, MultipleChoiceQuestion } from '../../utils/types';
import type { 
  IProgressAwareValidator,
  ValidationResult, 
  AnswerSubmission 
} from './IAnswerValidator';
import type { UserProgress } from '../../utils/types';
import { isMultipleChoiceQuestion } from '../../utils/types';

export class MultipleChoiceValidator implements IProgressAwareValidator {
  
  /**
   * Validates multiple choice answers
   */
  public validateAnswer(question: Question, submission: AnswerSubmission): ValidationResult {
    if (!this.canValidate(question)) {
      throw new Error(`MultipleChoiceValidator cannot validate question type: ${question.type}`);
    }

    const mcQuestion = question as MultipleChoiceQuestion;
    const userAnswer = submission.userAnswer as { selectedIndex: number };

    if (typeof userAnswer?.selectedIndex !== 'number') {
      throw new Error('Invalid submission format for multiple choice question');
    }

    const { selectedIndex } = userAnswer;
    const correctIndex = mcQuestion.correctAnswerIndex;
    const isCorrect = selectedIndex === correctIndex;

    // Base score calculation
    let score = isCorrect ? 1 : 0;

    // Apply difficulty bonus for harder questions
    if (isCorrect && mcQuestion.difficulty >= 7) {
      score += 0.1; // Bonus for difficult questions
    }

    // Time-based scoring
    const timePenalty = this.calculateTimePenalty(submission.timeSpent, mcQuestion.difficulty);
    const timeBonus = this.calculateTimeBonus(submission.timeSpent, mcQuestion.difficulty);
    
    const finalScore = Math.max(0, Math.min(1.2, score - timePenalty + timeBonus));

    // Generate feedback
    const feedback = this.generateFeedback(
      isCorrect, 
      selectedIndex, 
      correctIndex, 
      mcQuestion,
      submission.timeSpent
    );

    return {
      isCorrect,
      score: finalScore,
      feedback,
      explanation: this.getExplanation(mcQuestion, selectedIndex, correctIndex),
      timePenalty: timePenalty > 0 ? timePenalty : undefined
    };
  }

  /**
   * Validates answer with consideration for user progress
   */
  public validateWithProgress(
    question: Question, 
    submission: AnswerSubmission, 
    progress?: UserProgress
  ): ValidationResult {
    const baseResult = this.validateAnswer(question, submission);

    if (!progress) {
      return baseResult;
    }

    // Adjust scoring based on user's history with this question
    let adjustedScore = baseResult.score;

    // Penalty for repeated mistakes on the same question
    if (!baseResult.isCorrect && progress.unknownCount > 2) {
      adjustedScore *= 0.8; // 20% penalty for persistent difficulty
    }

    // Bonus for consistent correct answers
    if (baseResult.isCorrect && progress.consecutiveCorrect >= 3) {
      adjustedScore += 0.05; // Small bonus for consistency
    }

    // Adjust for user's overall performance on this difficulty level
    const expectedTime = this.getExpectedTime(question.difficulty);
    if (submission.timeSpent < expectedTime * 0.5) {
      // Very fast answer - might be lucky guess
      adjustedScore *= 0.9;
    }

    return {
      ...baseResult,
      score: Math.max(0, Math.min(1.2, adjustedScore)),
      feedback: baseResult.feedback + this.getProgressFeedback(progress, baseResult.isCorrect)
    };
  }

  /**
   * Maximum score includes potential bonuses
   */
  public getMaxScore(question: Question): number {
    if (!this.canValidate(question)) {
      throw new Error(`MultipleChoiceValidator cannot score question type: ${question.type}`);
    }
    return 1.2; // Base 1.0 + 0.1 difficulty bonus + 0.1 time bonus
  }

  /**
   * Can only validate multiple choice questions
   */
  public canValidate(question: Question): boolean {
    return isMultipleChoiceQuestion(question);
  }

  // Private helper methods

  private calculateTimePenalty(timeSpent: number, difficulty: number): number {
    const expectedTime = this.getExpectedTime(difficulty);
    const maxTime = expectedTime * 3; // 3x expected is maximum before penalty
    
    if (timeSpent > maxTime) {
      const excessTime = timeSpent - maxTime;
      const penaltyRate = 0.1 / (expectedTime * 2); // 10% penalty over 2x additional expected time
      return Math.min(0.3, excessTime * penaltyRate); // Cap at 30% penalty
    }
    
    return 0;
  }

  private calculateTimeBonus(timeSpent: number, difficulty: number): number {
    const expectedTime = this.getExpectedTime(difficulty);
    const fastTime = expectedTime * 0.7; // Faster than 70% of expected gets bonus
    
    if (timeSpent < fastTime && timeSpent > 1000) { // Minimum 1 second to avoid button mashing
      const timeSaved = fastTime - timeSpent;
      const bonusRate = 0.1 / (expectedTime * 0.3); // 10% bonus for 30% time saved
      return Math.min(0.1, timeSaved * bonusRate); // Cap at 10% bonus
    }
    
    return 0;
  }

  private getExpectedTime(difficulty: number): number {
    // Expected time in milliseconds based on difficulty
    const baseTime = 5000; // 5 seconds for difficulty 1
    const difficultyMultiplier = 1 + (difficulty - 1) * 0.3; // +30% per difficulty level
    return baseTime * difficultyMultiplier;
  }

  private generateFeedback(
    isCorrect: boolean,
    selectedIndex: number,
    correctIndex: number,
    question: MultipleChoiceQuestion,
    timeSpent: number
  ): string {
    if (isCorrect) {
      const timeCategory = this.categorizeTime(timeSpent, question.difficulty);
      const timeMessage = timeCategory === 'fast' ? ' Great timing!' : 
                         timeCategory === 'slow' ? ' Take your time to think it through.' : '';
      return `Correct!${timeMessage}`;
    } else {
      const correctOption = question.options[correctIndex];
      const selectedOption = question.options[selectedIndex];
      return `Incorrect. You selected "${selectedOption?.text || 'Unknown'}", but the correct answer is "${correctOption?.text || 'Unknown'}".`;
    }
  }

  private getExplanation(
    question: MultipleChoiceQuestion,
    selectedIndex: number,
    correctIndex: number
  ): string | undefined {
    // Return the explanation for the correct answer
    const correctOption = question.options[correctIndex];
    const selectedOption = question.options[selectedIndex];
    
    let explanation = question.explanation || correctOption?.explanation;
    
    // Add specific explanation for the selected wrong answer
    if (selectedIndex !== correctIndex && selectedOption?.explanation) {
      explanation = (explanation || '') + `\n\nWhy "${selectedOption.text}" is incorrect: ${selectedOption.explanation}`;
    }
    
    return explanation;
  }

  private getProgressFeedback(progress: UserProgress, isCorrect: boolean): string {
    if (isCorrect) {
      if (progress.consecutiveCorrect >= 3) {
        return ' You\'re on a roll!';
      } else if (progress.unknownCount > progress.knownCount) {
        return ' Nice improvement on this challenging question!';
      }
    } else {
      if (progress.unknownCount >= 3) {
        return ' This question seems tricky for you - consider reviewing the explanation carefully.';
      }
    }
    return '';
  }

  private categorizeTime(timeSpent: number, difficulty: number): 'fast' | 'normal' | 'slow' {
    const expectedTime = this.getExpectedTime(difficulty);
    
    if (timeSpent < expectedTime * 0.7) return 'fast';
    if (timeSpent > expectedTime * 1.5) return 'slow';
    return 'normal';
  }
}