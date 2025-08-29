import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { RevisionCard } from '../../../src/components/cards/RevisionCard';
import type { Question } from '../../../src/utils/types';

// Test data
const createMockQuestion = (id: string, questionText: string): Question => ({
  id,
  category: 'variables',
  subcategory: 'declaration',
  question: questionText,
  answer: `Answer for ${questionText}`,
  explanation: `Explanation for ${questionText}`,
  difficulty: 5,
  tags: ['test', 'mock'],
  type: 'flip-card'
});

describe('RevisionCard Flip Reset Tests', () => {
  const mockQuestion1 = createMockQuestion('q1', 'What is a variable?');
  const mockQuestion2 = createMockQuestion('q2', 'What is a constant?');
  const mockOnNext = vi.fn();
  const mockOnKnown = vi.fn();
  const mockOnUnknown = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Flip State Reset on Question Change', () => {
    test('should reset flip state when question prop changes', async () => {
      const { rerender, container } = render(
        <RevisionCard 
          question={mockQuestion1}
          onNext={mockOnNext}
          onKnown={mockOnKnown}
          onUnknown={mockOnUnknown}
        />
      );

      // Initially showing question (not flipped)
      const cardContainer = container.querySelector('.card-container');
      expect(cardContainer).not.toHaveClass('flipped');
      expect(screen.getByText('What is a variable?')).toBeInTheDocument();

      // Click to flip the card
      const card = screen.getByRole('button', { name: /Revision card/ });
      fireEvent.click(card);

      // Card should now be flipped (showing answer)
      await waitFor(() => {
        expect(cardContainer).toHaveClass('flipped');
      });

      // Change to a new question
      rerender(
        <RevisionCard 
          question={mockQuestion2}
          onNext={mockOnNext}
          onKnown={mockOnKnown}
          onUnknown={mockOnUnknown}
        />
      );

      // Card should reset to showing question (not flipped)
      expect(cardContainer).not.toHaveClass('flipped');
      expect(screen.getByText('What is a constant?')).toBeInTheDocument();
    });

    test('should reset flip state when question id changes but content is similar', async () => {
      const similarQuestion = { ...mockQuestion1, id: 'q1-updated' };
      
      const { rerender, container } = render(
        <RevisionCard 
          question={mockQuestion1}
          onNext={mockOnNext}
        />
      );

      const cardContainer = container.querySelector('.card-container');

      // Flip the card
      fireEvent.click(screen.getByRole('button', { name: /Revision card/ }));
      
      // Verify it's flipped
      await waitFor(() => {
        expect(cardContainer).toHaveClass('flipped');
      });

      // Update with similar question but different ID
      rerender(
        <RevisionCard 
          question={similarQuestion}
          onNext={mockOnNext}
        />
      );

      // Should reset even though content is similar
      expect(cardContainer).not.toHaveClass('flipped');
    });
  });

  describe('Keyboard Navigation with Flip Reset', () => {
    test('should reset flip state when navigating with keyboard', async () => {
      const { rerender, container } = render(
        <RevisionCard 
          question={mockQuestion1}
          onNext={mockOnNext}
        />
      );

      const card = screen.getByRole('button', { name: /Revision card/ });
      const cardContainer = container.querySelector('.card-container');
      
      // Flip with space key
      fireEvent.keyDown(card, { key: ' ' });
      
      await waitFor(() => {
        expect(cardContainer).toHaveClass('flipped');
      });

      // Navigate to next (Arrow Right)
      fireEvent.keyDown(card, { key: 'ArrowRight' });
      expect(mockOnNext).toHaveBeenCalled();

      // Simulate question change after navigation
      rerender(
        <RevisionCard 
          question={mockQuestion2}
          onNext={mockOnNext}
        />
      );

      // Card should be reset
      expect(cardContainer).not.toHaveClass('flipped');
      expect(screen.getByText('What is a constant?')).toBeInTheDocument();
    });

    test('should handle Known/Unknown actions before flip reset', async () => {
      const { rerender, container } = render(
        <RevisionCard 
          question={mockQuestion1}
          onKnown={mockOnKnown}
          onUnknown={mockOnUnknown}
          onNext={mockOnNext}
        />
      );

      const card = screen.getByRole('button', { name: /Revision card/ });
      const cardContainer = container.querySelector('.card-container');
      
      // Flip the card
      fireEvent.click(card);
      
      await waitFor(() => {
        expect(cardContainer).toHaveClass('flipped');
      });

      // Mark as known
      fireEvent.keyDown(card, { key: 'k' });
      expect(mockOnKnown).toHaveBeenCalled();

      // Change question
      rerender(
        <RevisionCard 
          question={mockQuestion2}
          onKnown={mockOnKnown}
          onUnknown={mockOnUnknown}
          onNext={mockOnNext}
        />
      );

      // Should reset for new question
      expect(cardContainer).not.toHaveClass('flipped');
      expect(screen.getByText('What is a constant?')).toBeInTheDocument();
    });
  });

  describe('Animation and Transition Handling', () => {
    test('should not cause visual glitches during reset', () => {
      const { rerender, container } = render(
        <RevisionCard 
          question={mockQuestion1}
          onNext={mockOnNext}
        />
      );

      const cardContainer = container.querySelector('.card-container');
      
      // Flip the card
      fireEvent.click(screen.getByRole('button', { name: /Revision card/ }));
      
      // Check flipped class is applied
      waitFor(() => {
        expect(cardContainer).toHaveClass('flipped');
      });

      // Change question
      rerender(
        <RevisionCard 
          question={mockQuestion2}
          onNext={mockOnNext}
        />
      );

      // Flipped class should be removed
      expect(cardContainer).not.toHaveClass('flipped');
    });

    test('should maintain focus after question change', () => {
      const { rerender } = render(
        <RevisionCard 
          question={mockQuestion1}
          onNext={mockOnNext}
        />
      );

      const card = screen.getByRole('button', { name: /Revision card/ });
      card.focus();
      
      // Verify focus
      expect(document.activeElement).toBe(card);

      // Change question
      rerender(
        <RevisionCard 
          question={mockQuestion2}
          onNext={mockOnNext}
        />
      );

      // Focus should be maintained on the card element
      const updatedCard = screen.getByRole('button', { name: /Revision card/ });
      expect(document.activeElement).toBe(updatedCard);
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid question changes', async () => {
      const { rerender, container } = render(
        <RevisionCard 
          question={mockQuestion1}
          onNext={mockOnNext}
        />
      );

      // Flip the card
      fireEvent.click(screen.getByRole('button', { name: /Revision card/ }));

      // Rapidly change questions
      for (let i = 2; i <= 5; i++) {
        const newQuestion = createMockQuestion(`q${i}`, `Question ${i}`);
        rerender(
          <RevisionCard 
            question={newQuestion}
            onNext={mockOnNext}
          />
        );
      }

      // Final state should show last question, not flipped
      await waitFor(() => {
        expect(screen.getByText('Question 5')).toBeInTheDocument();
        const finalCardContainer = container.querySelector('.card-container');
        expect(finalCardContainer).not.toHaveClass('flipped');
      });
    });

    test('should handle undefined question gracefully', () => {
      const { rerender } = render(
        <RevisionCard 
          question={mockQuestion1}
          onNext={mockOnNext}
        />
      );

      // Flip the card
      fireEvent.click(screen.getByRole('button', { name: /Revision card/ }));

      // Try to render with undefined (shouldn't crash)
      expect(() => {
        rerender(
          <RevisionCard 
            question={undefined as any}
            onNext={mockOnNext}
          />
        );
      }).not.toThrow();
    });
  });
});