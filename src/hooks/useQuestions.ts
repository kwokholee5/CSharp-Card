import { useState, useEffect, useCallback } from 'react';
import type { Question, Category } from '../utils/types';
import { questionService } from '../services/questionService';

export function useQuestions(category?: Category, subcategory?: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let loadedQuestions: Question[];
        
        if (category && subcategory) {
          loadedQuestions = await questionService.loadQuestions(category, subcategory);
        } else {
          loadedQuestions = await questionService.loadAllQuestions();
        }
        
        setQuestions(loadedQuestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [category, subcategory]);

  const shuffleQuestions = useCallback(() => {
    setQuestions(prev => questionService.shuffleQuestions(prev));
  }, []);

  const filterQuestions = useCallback((filters: {
    categories?: Category[];
    difficulties?: number[];
    tags?: string[];
  }) => {
    setQuestions(prev => questionService.filterQuestions(prev, filters));
  }, []);

  const searchQuestions = useCallback((query: string) => {
    if (!query) {
      return questions;
    }
    return questionService.searchQuestions(questions, query);
  }, [questions]);

  return {
    questions,
    loading,
    error,
    shuffleQuestions,
    filterQuestions,
    searchQuestions
  };
}