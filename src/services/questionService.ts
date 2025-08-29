// Service for loading and managing questions
// Uses direct imports instead of fetch to work with Cloudflare Pages

import type { Question } from '../utils/types';
import { getQuestions, getAllQuestions, getCategories } from '../data/questions';

interface Categories {
  [key: string]: {
    name: string;
    subcategories: string[];
  };
}

class QuestionService {
  private cache: Map<string, any> = new Map();

  async loadCategories(): Promise<Categories> {
    if (this.cache.has('categories')) {
      return this.cache.get('categories');
    }

    try {
      const categories = getCategories();
      this.cache.set('categories', categories);
      return categories;
    } catch (error) {
      console.error('Failed to load categories:', error);
      throw error;
    }
  }

  async loadQuestions(category: string, subcategory: string): Promise<Question[]> {
    const cacheKey = `${category}-${subcategory}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const questions = getQuestions(category, subcategory);
      
      if (!questions) {
        throw new Error(`No questions found for ${category}/${subcategory}`);
      }
      
      this.cache.set(cacheKey, questions);
      return questions;
    } catch (error) {
      console.error(`Failed to load questions for ${category}/${subcategory}:`, error);
      throw error;
    }
  }

  async loadAllQuestions(): Promise<Question[]> {
    const cacheKey = 'all-questions';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const allQuestions = getAllQuestions();
      this.cache.set(cacheKey, allQuestions);
      return allQuestions;
    } catch (error) {
      console.error('Failed to load all questions:', error);
      throw error;
    }
  }

  // Search for questions by query
  searchQuestions(questions: Question[], query: string): Question[] {
    const lowercaseQuery = query.toLowerCase();
    
    return questions.filter(q => {
      const questionText = q.question.toLowerCase();
      const answerText = 'answer' in q ? q.answer.toLowerCase() : '';
      const explanationText = q.explanation?.toLowerCase() || '';
      const tags = q.tags.join(' ').toLowerCase();
      
      return questionText.includes(lowercaseQuery) ||
             answerText.includes(lowercaseQuery) ||
             explanationText.includes(lowercaseQuery) ||
             tags.includes(lowercaseQuery);
    });
  }

  // Filter questions by difficulty
  filterByDifficulty(questions: Question[], minDifficulty: number, maxDifficulty: number): Question[] {
    return questions.filter(q => q.difficulty >= minDifficulty && q.difficulty <= maxDifficulty);
  }

  // Filter questions by tags
  filterByTags(questions: Question[], tags: string[]): Question[] {
    if (tags.length === 0) return questions;
    
    return questions.filter(q => 
      tags.some(tag => q.tags.includes(tag))
    );
  }

  // Get unique tags from questions
  getUniqueTags(questions: Question[]): string[] {
    const tagSet = new Set<string>();
    questions.forEach(q => q.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }

  // Get questions that are flip cards
  getFlipCardQuestions(questions: Question[]): Question[] {
    return questions.filter(q => !q.type || q.type === 'flip-card');
  }

  // Get questions that are multiple choice
  getMultipleChoiceQuestions(questions: Question[]): Question[] {
    return questions.filter(q => q.type === 'multiple-choice');
  }

  // Shuffle questions array
  shuffleQuestions(questions: Question[]): Question[] {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Filter questions with multiple criteria
  filterQuestions(
    questions: Question[],
    options: {
      difficulty?: { min: number; max: number };
      tags?: string[];
      search?: string;
    }
  ): Question[] {
    let filtered = questions;

    if (options.difficulty) {
      filtered = this.filterByDifficulty(filtered, options.difficulty.min, options.difficulty.max);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = this.filterByTags(filtered, options.tags);
    }

    if (options.search) {
      filtered = this.searchQuestions(filtered, options.search);
    }

    return filtered;
  }

  // Clear the cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const questionService = new QuestionService();