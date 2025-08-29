// Type definitions for the C# Revision Card System

export interface Question {
  id: string;
  question: string;
  answer: string;
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
}

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