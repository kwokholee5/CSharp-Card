import type { 
  Question, 
  FlipCardQuestion, 
  MultipleChoiceQuestion, 
  Category, 
  CategoryInfo, 
  QuestionFile
} from '../utils/types';
import { isFlipCardQuestion, isMultipleChoiceQuestion, getAnswerText } from '../utils/types';

class QuestionService {
  private cache = new Map<string, any>();
  private baseUrl = '/data';

  async loadCategories(): Promise<Record<Category, CategoryInfo>> {
    const cacheKey = 'categories';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/metadata/categories.json`);
      const data = await response.json();
      this.cache.set(cacheKey, data.categories);
      return data.categories;
    } catch (error) {
      console.error('Failed to load categories:', error);
      throw error;
    }
  }

  async loadQuestions(category: Category, subcategory: string): Promise<Question[]> {
    const cacheKey = `${category}-${subcategory}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/questions/${category}/${subcategory}.json`);
      const data: QuestionFile = await response.json();
      
      // Ensure backward compatibility by adding type discriminator if missing
      const questions = data.questions.map(q => {
        if (!(q as any).type) {
          // Legacy questions are flip cards - add type discriminator
          return { ...q, type: 'flip-card' as const } as Question;
        }
        return q;
      });
      
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
      const categories = await this.loadCategories();
      const allQuestions: Question[] = [];

      for (const [categoryKey, categoryInfo] of Object.entries(categories)) {
        for (const subcategoryKey of Object.keys(categoryInfo.subcategories)) {
          try {
            const questions = await this.loadQuestions(categoryKey as Category, subcategoryKey);
            allQuestions.push(...questions);
          } catch (error) {
            console.warn(`Skipping ${categoryKey}/${subcategoryKey}:`, error);
          }
        }
      }

      this.cache.set(cacheKey, allQuestions);
      return allQuestions;
    } catch (error) {
      console.error('Failed to load all questions:', error);
      throw error;
    }
  }

  searchQuestionsLegacy(questions: Question[], query: string): Question[] {
    const lowerQuery = query.toLowerCase();
    return questions.filter(q => {
      const basicMatch = 
        q.question.toLowerCase().includes(lowerQuery) ||
        q.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        q.category.toLowerCase().includes(lowerQuery) ||
        q.subcategory.toLowerCase().includes(lowerQuery);
      
      // Use polymorphic answer access
      const answerText = getAnswerText(q);
      return basicMatch || answerText.toLowerCase().includes(lowerQuery);
    });
  }

  filterQuestions(
    questions: Question[],
    filters: {
      categories?: Category[];
      difficulties?: number[];
      tags?: string[];
    }
  ): Question[] {
    let filtered = [...questions];

    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(q => filters.categories!.includes(q.category));
    }

    if (filters.difficulties && filters.difficulties.length > 0) {
      filtered = filtered.filter(q => filters.difficulties!.includes(q.difficulty));
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(q => 
        filters.tags!.some(tag => q.tags.includes(tag))
      );
    }

    return filtered;
  }

  shuffleQuestions(questions: Question[]): Question[] {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getQuestionsByDifficulty(questions: Question[], minDifficulty: number, maxDifficulty: number): Question[] {
    return questions.filter(q => q.difficulty >= minDifficulty && q.difficulty <= maxDifficulty);
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Helper methods for working with polymorphic questions
  getFlipCardQuestions(questions: Question[]): FlipCardQuestion[] {
    return questions.filter(isFlipCardQuestion);
  }

  getMultipleChoiceQuestions(questions: Question[]): MultipleChoiceQuestion[] {
    return questions.filter(isMultipleChoiceQuestion);
  }

  // Enhanced search that works with both question types
  searchQuestions(questions: Question[], query: string): Question[] {
    const lowerQuery = query.toLowerCase();
    return questions.filter(q => {
      // Common fields
      const matchesCommon = 
        q.question.toLowerCase().includes(lowerQuery) ||
        q.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        q.category.toLowerCase().includes(lowerQuery) ||
        q.subcategory.toLowerCase().includes(lowerQuery) ||
        (q.explanation && q.explanation.toLowerCase().includes(lowerQuery));

      // Type-specific fields
      if (isFlipCardQuestion(q)) {
        return matchesCommon || q.answer.toLowerCase().includes(lowerQuery);
      } else {
        // For multiple choice, search in options text
        return matchesCommon || 
          q.options.some(option => 
            option.text.toLowerCase().includes(lowerQuery) ||
            (option.explanation && option.explanation.toLowerCase().includes(lowerQuery))
          );
      }
    });
  }

  // Get answer text that works for both question types
  getQuestionAnswer(question: Question): string {
    return getAnswerText(question);
  }

  // Validate question structure
  validateQuestion(question: any): question is Question {
    if (!question.id || !question.question || !question.type) {
      return false;
    }

    if (question.type === 'flip-card') {
      return typeof question.answer === 'string';
    } else if (question.type === 'multiple-choice') {
      return Array.isArray(question.options) && 
             typeof question.correctAnswerIndex === 'number' &&
             question.options.length > 0 &&
             question.correctAnswerIndex >= 0 && 
             question.correctAnswerIndex < question.options.length;
    }

    return false;
  }

  // Filter questions by type
  filterByType(questions: Question[], type: 'flip-card' | 'multiple-choice'): Question[] {
    return questions.filter(q => q.type === type);
  }
}

export const questionService = new QuestionService();