import type { Question, Category, CategoryInfo, QuestionFile } from '../utils/types';

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
      this.cache.set(cacheKey, data.questions);
      return data.questions;
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

  searchQuestions(questions: Question[], query: string): Question[] {
    const lowerQuery = query.toLowerCase();
    return questions.filter(q => 
      q.question.toLowerCase().includes(lowerQuery) ||
      q.answer.toLowerCase().includes(lowerQuery) ||
      q.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      q.category.toLowerCase().includes(lowerQuery) ||
      q.subcategory.toLowerCase().includes(lowerQuery)
    );
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
}

export const questionService = new QuestionService();