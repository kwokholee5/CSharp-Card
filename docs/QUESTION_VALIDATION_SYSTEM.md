# Question Validation System

## Overview
This document outlines the systematic approach to ensure all multiple-choice questions have technically accurate answers.

## Validation Process

### 1. Code Execution Simulation
For each question:
- **Step 1**: Extract the `codeExample.code` 
- **Step 2**: Mentally execute line by line OR use online C# compiler
- **Step 3**: Compare result with `codeExample.output`
- **Step 4**: Verify correct answer matches the expected output

### 2. Answer Option Analysis  
For each option:
- **Check Format**: Does the format match the Console.WriteLine output?
- **Check Line Count**: Multiple Console.WriteLine = multiple lines
- **Check Values**: Are the values technically correct?
- **Check Explanations**: Do explanations accurately describe the behavior?

### 3. Common Issues to Watch For

#### **Format Issues**
- ❌ Single line when code has multiple Console.WriteLine
- ❌ Missing newlines (\n) in multi-line outputs
- ❌ Wrong method names (e.g., "System.Int32" vs "Int32")

#### **Technical Accuracy Issues**
- ❌ Incorrect understanding of value vs reference types
- ❌ Wrong default values for types
- ❌ Misunderstanding of nullable behavior
- ❌ Incorrect floating-point precision representation

#### **C# Specific Details**
- ❌ `GetType().Name` returns "Int32", not "System.Int32"
- ❌ `GetValueOrDefault()` on null nullable returns type default (0 for int)
- ❌ String immutability behavior
- ❌ Boxing preserves original type

### 4. Validation Checklist

For each question, verify:

**Code Block:**
- [ ] Code compiles without errors
- [ ] Code produces expected output
- [ ] Output format matches Console.WriteLine behavior

**Answer Options:**
- [ ] Correct answer index points to technically accurate option
- [ ] Incorrect options have plausible but wrong values
- [ ] All options follow same format pattern
- [ ] Explanations are technically accurate

**Multi-line Outputs:**
- [ ] Count Console.WriteLine statements
- [ ] Ensure answer options show same number of lines
- [ ] Use \n for line breaks in JSON
- [ ] Test with actual console output format

### 5. Testing Methodology

#### **Manual Verification (Preferred)**
1. Trace through code execution step by step
2. Apply C# language rules (immutability, boxing, etc.)
3. Verify output format matches Console.WriteLine behavior

#### **Online Compiler Verification**
1. Use [.NET Fiddle](https://dotnetfiddle.net/) or similar
2. Copy exact code from question
3. Compare actual output with expected output
4. Update questions if discrepancies found

#### **Automated Testing (Future)**
- Create unit tests that execute question code
- Compare outputs programmatically
- Flag questions with mismatched outputs

### 6. Quality Standards

**Interview-Grade Accuracy:**
- Zero tolerance for technical inaccuracies
- All edge cases properly handled
- Explanations teach correct C# concepts
- No misleading or confusing options

**Professional Standards:**
- Consistent formatting across all questions
- Clear, unambiguous language
- Proper C# terminology
- Educational value in explanations

## Maintenance Process

**Before Adding New Questions:**
1. Run through full validation checklist
2. Test code execution manually or online
3. Verify all answer options are plausible
4. Review explanations for accuracy

**Regular Audits:**
1. Re-validate existing questions quarterly
2. Update based on C# language changes
3. Incorporate feedback from users
4. Maintain technical accuracy standards

## Tools for Validation

**Online C# Compilers:**
- [.NET Fiddle](https://dotnetfiddle.net/)
- [repl.it C#](https://replit.com/)
- [OneCompiler C#](https://onecompiler.com/csharp)

**Documentation References:**
- [Microsoft C# Documentation](https://docs.microsoft.com/en-us/dotnet/csharp/)
- [C# Language Specification](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/)
