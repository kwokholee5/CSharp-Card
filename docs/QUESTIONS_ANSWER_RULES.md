# Question-Answer Design Rules

## Core Principle: Preserve Learning Value

The primary goal of the C# Interview Quiz is to help users learn through challenge and discovery, not to provide answers directly.

## Rule 1: Respect the Coding Logic and Question Intent

### ❌ WRONG - Ignoring Code Behavior
```csharp
// Question: "What will be the output of this loop?"
// Code: Console.WriteLine(i) in a loop
// MC Options: "0, 1, 2" (single line with commas)

// Problem: Console.WriteLine() produces multi-line output, not single line
```

**Problem:** Multiple choice options don't match the actual behavior of the code being tested.

### ✅ CORRECT - Respect Code Behavior
```csharp
// Question: "What will be the output of this loop?"
// Code: Console.WriteLine(i) in a loop
// MC Options: "0\n1\n2" or "0, 1, 2" (clarifying it's the sequence)

// Benefit: Options accurately reflect the code's actual behavior
```

**Benefit:** Students learn to analyze code behavior correctly, not make assumptions.

### Key Principle:
- **Respect the actual behavior** of the code being tested
- **Don't make assumptions** about output format
- **Ensure MC options match** the code's real behavior
- **Test understanding of coding logic**, not memorization

## Rule 2: Code Examples Must Not Reveal Answers

### ❌ WRONG - Code Example Spoils Answer
```csharp
// Question: "Which of the following is NOT a valid C# data type?"
// MC Options: string, double, boolean, int

// Code Example (WRONG):
bool isValid = true;    // ← This reveals 'bool' is correct
int number = 42;        // ← This reveals 'int' is correct  
string text = "Hello";  // ← This reveals 'string' is correct
double value = 3.14;    // ← This reveals 'double' is correct
```

**Problem:** User immediately knows `boolean` is wrong because code shows `bool`.

### ✅ CORRECT - Code Example Supports Learning
```csharp
// Question: "Which of the following is NOT a valid C# data type?"
// MC Options: string, double, boolean, int

// Code Example (CORRECT):
var isValid = true;     // ← Uses 'var', doesn't reveal specific type
var number = 42;        // ← Uses 'var', doesn't reveal specific type
var text = "Hello";     // ← Uses 'var', doesn't reveal specific type
var value = 3.14;       // ← Uses 'var', doesn't reveal specific type
```

**Benefit:** User must think about C# data types without being given the answer.

## Rule 3: Code Examples Should Provide Context, Not Solutions

### Purpose of Code Examples:
- **Provide context** for the question
- **Demonstrate concepts** being tested
- **Support learning** without revealing answers
- **Create realistic scenarios** for the question

### What Code Examples Should NOT Do:
- **Reveal the correct answer** directly
- **Show the exact data type** being tested
- **Provide obvious hints** that eliminate thinking
- **Make the question trivial** to answer

## Rule 4: Question Design Guidelines

### For Data Type Questions:
- Use `var` instead of specific types in examples
- Focus on usage patterns, not type names
- Test understanding of concepts, not memorization

### For Code Output Questions:
- Show code that requires analysis
- Don't include the output in the example
- Require understanding of concepts to predict output
- **Ensure MC options match the actual code behavior**

### For Multiple Choice Questions:
- Ensure all options are plausible
- Don't make correct answer obvious from context
- Test deeper understanding, not surface-level matching
- **Respect the coding logic being tested**

## Rule 5: Revision and Learning Value

### Questions Must Enable:
- **Critical thinking** and analysis
- **Learning from mistakes** through explanations
- **Conceptual understanding** beyond memorization
- **Meaningful revision** when answers are wrong
- **Accurate understanding** of code behavior

### Questions Must NOT:
- **Spoil answers** in supporting materials
- **Make explanations redundant** due to obvious hints
- **Reduce learning value** through poor design
- **Create false confidence** from trivial questions
- **Contradict the actual code behavior** being tested

## Rule 6: Validation and Testing

### Before Publishing Questions:
1. **Test with fresh eyes** - Does the code example reveal the answer?
2. **Verify learning value** - Will users learn from getting this wrong?
3. **Check explanation relevance** - Is the explanation meaningful?
4. **Ensure challenge level** - Does it require thinking and analysis?
5. **Validate code behavior** - Do MC options match the actual code output?
6. **Respect coding logic** - Are we testing the right behavior?

### Red Flags:
- Code example shows exact answer
- Question becomes trivial with context
- Explanation repeats what code example already showed
- No learning opportunity for incorrect answers
- **MC options don't match code behavior**
- **Assumptions made about output format**

## Implementation Checklist

- [ ] Code example doesn't reveal the answer
- [ ] Question requires critical thinking
- [ ] Wrong answers provide learning opportunities
- [ ] Explanations add value beyond obvious hints
- [ ] Question tests understanding, not memorization
- [ ] Revision process is meaningful and educational
- [ ] **MC options respect the actual code behavior**
- [ ] **No assumptions made about output format**
- [ ] **Coding logic is accurately represented**
