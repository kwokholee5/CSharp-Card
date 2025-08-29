# Data Access Layer

This directory contains the data access layer implementation following the Repository pattern and Dependency Inversion Principle (DIP).

## Architecture

The data access layer is composed of three main components:

1. **IQuestionRepository** - Main interface for question data operations
2. **IQuestionLoader** - Interface for loading raw data from files
3. **IQuestionParser** - Interface for transforming raw data to domain models

## Usage Example

```typescript
import { 
  JsonQuestionRepository, 
  QuestionLoader, 
  QuestionParser 
} from './repositories';

// Create dependencies
const loader = new QuestionLoader();
const parser = new QuestionParser();

// Configure question file paths
const questionPaths = [
  'data/questions/basics/data-types-mc.json',
  'data/questions/basics/control-flow-mc.json',
  'data/questions/oop/classes-mc.json'
];

// Create repository with dependency injection
const repository = new JsonQuestionRepository(loader, parser, questionPaths);

// Use the repository
async function loadQuestions() {
  try {
    // Load all questions
    const questions = await repository.loadQuestions();
    console.log(`Loaded ${questions.length} questions`);
    
    // Get specific question
    const question = await repository.getQuestionById('dtmc-0001');
    if (question) {
      console.log(`Found question: ${question.text}`);
    }
    
    // Get questions by category
    const basicsQuestions = await repository.getQuestionsByCategory('basics');
    console.log(`Found ${basicsQuestions.length} basics questions`);
    
    // Get available categories
    const categories = await repository.getAvailableCategories();
    console.log(`Available categories: ${categories.join(', ')}`);
    
  } catch (error) {
    console.error('Failed to load questions:', error);
  }
}
```

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- **QuestionLoader**: Only responsible for loading raw data from files
- **QuestionParser**: Only responsible for parsing and validating data
- **JsonQuestionRepository**: Only responsible for coordinating data access operations

### Open/Closed Principle (OCP)
- New data sources can be added by implementing `IQuestionLoader`
- New parsing logic can be added by implementing `IQuestionParser`
- New repository types can be added by implementing `IQuestionRepository`

### Liskov Substitution Principle (LSP)
- All implementations can be substituted for their interfaces without breaking functionality
- Mock implementations can be used for testing

### Interface Segregation Principle (ISP)
- Interfaces are focused and specific to their responsibilities
- Clients depend only on the methods they actually use

### Dependency Inversion Principle (DIP)
- High-level `JsonQuestionRepository` depends on abstractions (`IQuestionLoader`, `IQuestionParser`)
- Concrete implementations are injected as dependencies
- Easy to test with mock implementations

## Error Handling

The data access layer uses specific error types:

- **DataLoadError**: Thrown when file loading or network operations fail
- **ValidationError**: Thrown when data validation fails during parsing

Both errors include detailed information about the failure cause and can be caught and handled appropriately by the application.

## Testing

Each component has comprehensive unit tests:

- `QuestionLoader.test.ts`: Tests file loading operations
- `QuestionParser.test.ts`: Tests data parsing and validation
- `JsonQuestionRepository.test.ts`: Tests repository coordination and caching

Run tests with:
```bash
npm test test/repositories
```