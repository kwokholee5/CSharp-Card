// Quick debug script to test question validation
import { QuestionParser } from './src/repositories/QuestionParser.js';

async function testQuestionValidation() {
    const parser = new QuestionParser();
    
    // Test with a simple question first
    const testQuestion = {
        "id": "test-001",
        "question": "Test question?",
        "type": "multiple-choice",
        "options": [
            {
                "id": "a",
                "text": "Option A"
            },
            {
                "id": "b", 
                "text": "Option B"
            }
        ],
        "correctAnswerIndex": 0,
        "explanation": "Test explanation",
        "category": "basics",
        "difficulty": 2,
        "tags": ["test"]
    };
    
    console.log('Testing validation...');
    const result = parser.validateQuestionData(testQuestion);
    console.log('Validation result:', result);
    
    if (!result.isValid) {
        console.log('Validation errors:', result.errors);
    }
}

testQuestionValidation().catch(console.error);
