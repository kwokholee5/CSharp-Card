// Type definitions for the C# Revision Card System

// Base question interface - common properties for all question types
export interface BaseQuestion {
  id: string;
  question: string;
  explanation?: string;
  codeExample?: CodeExample;
  category: Category;
  subcategory: string;
  difficulty: number;
  tags: string[];
  references?: Reference[];
  createdAt: string;
  updatedAt: string;
  version: number;
  type: QuestionType; // Discriminator property for polymorphism
}

// Question type discriminator
export type QuestionType = 'flip-card' | 'multiple-choice';

// Flip card question (existing behavior)
export interface FlipCardQuestion extends BaseQuestion {
  type: 'flip-card';
  answer: string;
}

// Multiple choice question interface
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: MultipleChoiceOption[];
  correctAnswerIndex: number;
  multiSelect?: boolean; // Future: support multiple correct answers
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  explanation?: string; // Optional explanation for why this option is correct/incorrect
}

// Union type for all question types - this maintains type safety
export type Question = FlipCardQuestion | MultipleChoiceQuestion;

export interface CodeExample {
  language: 'csharp';
  code: string;
  output?: string;
}

export interface Reference {
  title: string;
  url: string;
}

export type Category = 'basics' | 'intermediate' | 'advanced' | 'expert';

export interface CategoryInfo {
  name: string;
  description: string;
  icon: string;
  color: string;
  difficultyRange: [number, number];
  estimatedTimeMinutes: number;
  subcategories: Record<string, SubcategoryInfo>;
}

export interface SubcategoryInfo {
  name: string;
  description: string;
  file: string;
  questionCount: number;
  avgDifficulty: number;
}

export interface QuestionFile {
  $schema?: string;
  metadata: {
    category: Category;
    subcategory: string;
    fileVersion: number;
    lastUpdated: string;
    questionCount: number;
    avgDifficulty: number;
  };
  questions: Question[];
}

export interface UserProgress {
  questionId: string;
  knownCount: number;
  unknownCount: number;
  lastStudied: string;
  nextReview?: string;
  difficulty: number;
  consecutiveCorrect: number;
  averageTime: number;
  isFavorite: boolean;
}

export interface StudySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  cardsStudied: number;
  correctAnswers: number;
  timePerCard: number[];
  categories: string[];
  sessionType: 'review' | 'new' | 'mixed';
}

export interface StudyStats {
  totalCardsStudied: number;
  averageAccuracy: number;
  studyStreak: number;
  timeSpent: number;
  lastStudyDate: string;
}

export interface FilterOptions {
  categories: Category[];
  difficulties: number[];
  tags: string[];
  searchQuery: string;
}

export interface CardState {
  isFlipped: boolean;
  isKnown?: boolean;
  timeSpent: number;
}

// Type guard functions for type safety
export function isFlipCardQuestion(question: Question): question is FlipCardQuestion {
  return question.type === 'flip-card';
}

export function isMultipleChoiceQuestion(question: Question): question is MultipleChoiceQuestion {
  return question.type === 'multiple-choice';
}

// Helper function to get question display text (works for both types)
export function getQuestionText(question: Question): string {
  return question.question;
}

// Helper function to get answer text (polymorphic)
export function getAnswerText(question: Question): string {
  if (isFlipCardQuestion(question)) {
    return question.answer;
  } else {
    // For MC questions, return the text of the correct option
    const correctOption = question.options[question.correctAnswerIndex];
    return correctOption ? correctOption.text : 'No correct answer found';
  }
}