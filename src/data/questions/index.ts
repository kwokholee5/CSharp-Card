// Central import for all question data
// This ensures the data is bundled with the application

import variablesData from '../../../data/questions/basics/variables.json';
import dataTypesMCData from '../../../data/questions/basics/data-types-mc.json';
import type { Question } from '../../utils/types';

export interface QuestionFile {
  category: string;
  subcategory: string;
  questions: Question[];
}

// Transform the JSON structure to match QuestionFile interface
function transformQuestionFile(data: any, category: string, subcategory: string): QuestionFile {
  return {
    category: data.metadata?.category || category,
    subcategory: data.metadata?.subcategory || subcategory,
    questions: data.questions || []
  };
}

// Map of all available question files
export const questionData: Record<string, Record<string, QuestionFile>> = {
  basics: {
    variables: transformQuestionFile(variablesData, 'basics', 'variables'),
    'data-types-mc': transformQuestionFile(dataTypesMCData, 'basics', 'data-types-mc'),
  }
};

// Get questions for a specific category and subcategory
export function getQuestions(category: string, subcategory: string): Question[] | null {
  const categoryData = questionData[category];
  if (!categoryData) return null;
  
  const subcategoryData = categoryData[subcategory];
  if (!subcategoryData) return null;
  
  // Ensure backward compatibility - add type if missing
  return subcategoryData.questions.map(q => {
    if (!(q as any).type) {
      return { ...q, type: 'flip-card' as const } as Question;
    }
    return q;
  });
}

// Get all questions across all categories
export function getAllQuestions(): Question[] {
  const allQuestions: Question[] = [];
  
  for (const category of Object.values(questionData)) {
    for (const subcategory of Object.values(category)) {
      const questions = subcategory.questions.map(q => {
        if (!(q as any).type) {
          return { ...q, type: 'flip-card' as const } as Question;
        }
        return q;
      });
      allQuestions.push(...questions);
    }
  }
  
  return allQuestions;
}

// Get all categories and subcategories
export function getCategories(): Record<string, { name: string; subcategories: string[] }> {
  const categories: Record<string, { name: string; subcategories: string[] }> = {};
  
  for (const [categoryKey, categoryData] of Object.entries(questionData)) {
    categories[categoryKey] = {
      name: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
      subcategories: Object.keys(categoryData)
    };
  }
  
  return categories;
}