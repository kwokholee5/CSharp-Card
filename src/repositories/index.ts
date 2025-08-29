// Data Access Layer Exports
// Following Dependency Inversion Principle by exporting both interfaces and implementations

// Interfaces
export { IQuestionRepository } from '../interfaces/repositories/IQuestionRepository';
export { IQuestionLoader, RawQuestionData, RawQuestionFile } from '../interfaces/repositories/IQuestionLoader';
export { IQuestionParser, IParseValidationResult } from '../interfaces/repositories/IQuestionParser';

// Concrete Implementations
export { JsonQuestionRepository } from './JsonQuestionRepository';
export { QuestionLoader } from './QuestionLoader';
export { QuestionParser } from './QuestionParser';

// Error Classes
export { DataLoadError } from '../models/errors/DataLoadError';
export { ValidationError } from '../models/errors/ValidationError';