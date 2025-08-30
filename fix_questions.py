#!/usr/bin/env python3
import json
import re
from pathlib import Path

def clean_explanation(explanation):
    """Remove 'Correct!' and 'Incorrect.' prefixes from explanations"""
    if not explanation:
        return explanation
    
    # Remove "Correct! " prefix
    explanation = re.sub(r'^Correct!\s*', '', explanation)
    # Remove "Incorrect. " prefix
    explanation = re.sub(r'^Incorrect\.\s*', '', explanation)
    
    return explanation

def clean_code_comments(code):
    """Remove revealing comments from code examples"""
    if not code:
        return code
    
    # Remove "// Equivalent to:" and subsequent lines until a non-comment line
    lines = code.split('\n')
    cleaned_lines = []
    skip_next = False
    
    for i, line in enumerate(lines):
        if skip_next and line.strip().startswith('//'):
            continue
        skip_next = False
        
        # Skip revealing comments
        if '// Equivalent to:' in line:
            skip_next = True
            continue
        if '// Both produce the same result' in line:
            continue
        if '// Safe - doesn\'t block' in line:
            continue
        if '// Dangerous - can deadlock' in line:
            continue
        if '// Appears immediately' in line:
            continue
        if '// May be buffered' in line:
            continue
        if '// Forces immediate output' in line:
            continue
        
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).rstrip()

def fix_newline_display(text):
    """Fix display of escape sequences in answer options"""
    # For the specific case of console-0006 option b
    # The text should show actual newline and tab, not the escape sequences
    if text == "Hello\\nWorld\\tTab":
        return "Hello\nWorld\tTab"
    return text

def process_question_file(filepath):
    """Process a single question JSON file"""
    print(f"Processing {filepath}...")
    
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    modifications = 0
    
    # Process each question
    for question in data.get('questions', []):
        # Clean up options
        for option in question.get('options', []):
            # Clean explanation
            original_explanation = option.get('explanation', '')
            cleaned_explanation = clean_explanation(original_explanation)
            if cleaned_explanation != original_explanation:
                option['explanation'] = cleaned_explanation
                modifications += 1
            
            # Fix technical inaccuracies in text
            original_text = option.get('text', '')
            fixed_text = fix_newline_display(original_text)
            if fixed_text != original_text:
                option['text'] = fixed_text
                modifications += 1
        
        # Clean code examples
        code_example = question.get('codeExample', {})
        if 'code' in code_example:
            original_code = code_example['code']
            cleaned_code = clean_code_comments(original_code)
            if cleaned_code != original_code:
                code_example['code'] = cleaned_code
                modifications += 1
    
    # Special fix for operators-mc.json op-0001 option b
    if 'operators-mc.json' in str(filepath):
        for question in data.get('questions', []):
            if question.get('id') == 'op-0001':
                for option in question.get('options', []):
                    if option.get('id') == 'b':
                        # Fix the contradictory explanation
                        option['explanation'] = "This would be the result if evaluated differently."
                        modifications += 1
    
    # Write back the cleaned data
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"  - Made {modifications} modifications")
    return modifications

def main():
    """Process all question files"""
    base_path = Path('/home/jacklee/CSharp-Card/public/data/questions')
    
    files_to_process = [
        'basics/console-output-mc.json',
        'basics/operators-mc.json',
        'basics/data-types-mc.json',
        'intermediate/collections-mc.json',
        'intermediate/oop-fundamentals-mc.json',
        'advanced/async-await-mc.json',
        'advanced/generics-mc.json',
        'expert/reflection-mc.json'
    ]
    
    total_modifications = 0
    
    for file_path in files_to_process:
        full_path = base_path / file_path
        if full_path.exists():
            modifications = process_question_file(full_path)
            total_modifications += modifications
        else:
            print(f"Warning: {full_path} not found")
    
    print(f"\nTotal modifications made: {total_modifications}")
    print("All question files have been cleaned!")

if __name__ == "__main__":
    main()