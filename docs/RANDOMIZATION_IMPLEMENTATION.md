# Question and Option Randomization Implementation

## Overview

The application now supports randomizing both the order of questions and the order of multiple choice options when users connect to the website. This feature ensures a fresh experience on each visit and prevents memorization of answer positions.

## Architecture

### Components

1. **IShuffleService** - Interface defining randomization operations
2. **ShuffleService** - Implementation using Fisher-Yates shuffle algorithm
3. **QuestionManager** - Extended to support randomization during initialization
4. **Dependency Injection** - Properly configured to inject shuffle service

### Key Design Principles

- **SOLID Compliance**: Each component has a single responsibility
- **Dependency Inversion**: Services depend on abstractions, not concrete implementations
- **Immutability**: Original data structures are preserved, new instances created
- **Answer Integrity**: Correct answer indices are properly maintained after shuffling

## Implementation Details

### Shuffle Service (`src/services/ShuffleService.ts`)

```typescript
class ShuffleService implements IShuffleService {
  // Shuffles question order
  shuffleQuestions(questions: IQuestion[]): IQuestion[]
  
  // Shuffles options within a question while maintaining answer correctness
  shuffleQuestionOptions(question: IQuestion): IQuestion
  
  // Creates index mapping for answer preservation
  shuffleOptionsWithMapping(options: IOption[]): { shuffledOptions, indexMapping }
  
  // Maps original answer indices to new positions
  mapAnswerIndices(originalIndices: number[], indexMapping: number[]): number[]
}
```

### Question Manager Integration

The `QuestionManager.initialize()` method now accepts options to control randomization:

```typescript
interface QuestionManagerInitOptions {
  shuffleQuestions?: boolean;  // default: true
  shuffleOptions?: boolean;    // default: true
}
```

### Answer Correctness Preservation

When options are shuffled, the system:
1. Creates a mapping from original positions to new positions
2. Updates `correctAnswers` indices to point to the new positions
3. Ensures the same option texts remain correct regardless of order

## Usage

### Default Behavior
By default, both question order and option order are randomized:

```typescript
await questionManager.initialize(); // Randomization enabled by default
```

### Custom Configuration
Randomization can be controlled per component:

```typescript
await questionManager.initialize({
  shuffleQuestions: true,   // Randomize question order
  shuffleOptions: false     // Keep options in original order
});
```

## Testing

Comprehensive tests ensure:
- **Shuffle Algorithms**: Fisher-Yates implementation correctness
- **Answer Preservation**: Correct answers remain valid after shuffling
- **Interface Compliance**: Shuffled questions implement IQuestion correctly
- **Integration**: QuestionManager properly delegates to ShuffleService

Key test files:
- `test/services/ShuffleService.test.ts` - Core shuffle logic
- `test/services/QuestionManager.test.ts` - Integration with question management

## Benefits

1. **Enhanced Learning**: Prevents position-based memorization
2. **Fresh Experience**: Different question and option orders each session
3. **Maintained Accuracy**: Answer validation works correctly regardless of shuffling
4. **Configurable**: Can be disabled if needed for testing or specific scenarios
5. **Performance**: Efficient O(n) shuffle algorithm with minimal memory overhead

## Backward Compatibility

The implementation is fully backward compatible:
- Existing code continues to work without changes
- Tests pass without modification (after adding shuffle service mocks)
- Default behavior enables randomization for improved user experience

## Future Enhancements

Potential improvements could include:
- Seed-based randomization for reproducible question orders
- Per-user randomization persistence across sessions
- Question difficulty-based shuffling algorithms
- Analytics on randomization effectiveness
