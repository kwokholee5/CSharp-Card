import { StateManager } from '../../src/services/StateManager';
import type { IQuestionState } from '../../src/interfaces/domain/types';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('constructor', () => {
    it('should initialize with default state', () => {
      const state = stateManager.getApplicationState();
      
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.questionStates.size).toBe(0);
      expect(state.isInitialized).toBe(false);
      expect(state.totalQuestions).toBe(0);
    });
  });

  describe('getApplicationState', () => {
    it('should return immutable copy of state', () => {
      const state1 = stateManager.getApplicationState();
      const state2 = stateManager.getApplicationState();
      
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2); // Different objects
      expect(state1.questionStates).not.toBe(state2.questionStates); // Different Map instances
    });

    it('should not allow external modification of returned state', () => {
      const state = stateManager.getApplicationState();
      state.currentQuestionIndex = 999;
      state.questionStates.set('test', {
        selectedAnswers: [0],
        isSubmitted: true,
        isCorrect: true
      });
      
      const freshState = stateManager.getApplicationState();
      expect(freshState.currentQuestionIndex).toBe(0);
      expect(freshState.questionStates.size).toBe(0);
    });
  });

  describe('updateQuestionState', () => {
    it('should update question state correctly', () => {
      const questionId = 'question-1';
      const questionState: IQuestionState = {
        selectedAnswers: [0, 2],
        isSubmitted: true,
        isCorrect: false,
        submittedAt: new Date('2023-01-01T10:00:00Z')
      };

      stateManager.updateQuestionState(questionId, questionState);
      
      const retrievedState = stateManager.getQuestionState(questionId);
      expect(retrievedState).toEqual(questionState);
      expect(retrievedState).not.toBe(questionState); // Should be immutable copy
    });

    it('should create immutable copy of question state', () => {
      const questionId = 'question-1';
      const originalState: IQuestionState = {
        selectedAnswers: [0, 1],
        isSubmitted: false,
        isCorrect: false
      };

      stateManager.updateQuestionState(questionId, originalState);
      
      // Modify original state
      originalState.selectedAnswers.push(2);
      originalState.isSubmitted = true;
      
      const retrievedState = stateManager.getQuestionState(questionId);
      expect(retrievedState?.selectedAnswers).toEqual([0, 1]);
      expect(retrievedState?.isSubmitted).toBe(false);
    });

    it('should handle date immutability correctly', () => {
      const questionId = 'question-1';
      const submittedAt = new Date('2023-01-01T10:00:00Z');
      const questionState: IQuestionState = {
        selectedAnswers: [0],
        isSubmitted: true,
        isCorrect: true,
        submittedAt
      };

      stateManager.updateQuestionState(questionId, questionState);
      
      // Modify original date
      submittedAt.setFullYear(2024);
      
      const retrievedState = stateManager.getQuestionState(questionId);
      expect(retrievedState?.submittedAt?.getFullYear()).toBe(2023);
    });

    it('should throw error for empty question ID', () => {
      const questionState: IQuestionState = {
        selectedAnswers: [0],
        isSubmitted: true,
        isCorrect: true
      };

      expect(() => {
        stateManager.updateQuestionState('', questionState);
      }).toThrow('Question ID cannot be empty');
    });

    it('should overwrite existing question state', () => {
      const questionId = 'question-1';
      const firstState: IQuestionState = {
        selectedAnswers: [0],
        isSubmitted: false,
        isCorrect: false
      };
      const secondState: IQuestionState = {
        selectedAnswers: [1, 2],
        isSubmitted: true,
        isCorrect: true
      };

      stateManager.updateQuestionState(questionId, firstState);
      stateManager.updateQuestionState(questionId, secondState);
      
      const retrievedState = stateManager.getQuestionState(questionId);
      expect(retrievedState).toEqual(secondState);
    });
  });

  describe('getQuestionState', () => {
    it('should return null for non-existent question', () => {
      const state = stateManager.getQuestionState('non-existent');
      expect(state).toBeNull();
    });

    it('should return null for empty question ID', () => {
      const state = stateManager.getQuestionState('');
      expect(state).toBeNull();
    });

    it('should return immutable copy of question state', () => {
      const questionId = 'question-1';
      const questionState: IQuestionState = {
        selectedAnswers: [0, 1],
        isSubmitted: true,
        isCorrect: false
      };

      stateManager.updateQuestionState(questionId, questionState);
      
      const retrievedState1 = stateManager.getQuestionState(questionId);
      const retrievedState2 = stateManager.getQuestionState(questionId);
      
      expect(retrievedState1).toEqual(retrievedState2);
      expect(retrievedState1).not.toBe(retrievedState2);
      expect(retrievedState1?.selectedAnswers).not.toBe(retrievedState2?.selectedAnswers);
    });

    it('should not allow external modification of returned state', () => {
      const questionId = 'question-1';
      const questionState: IQuestionState = {
        selectedAnswers: [0],
        isSubmitted: false,
        isCorrect: false
      };

      stateManager.updateQuestionState(questionId, questionState);
      
      const retrievedState = stateManager.getQuestionState(questionId);
      retrievedState!.selectedAnswers.push(1);
      retrievedState!.isSubmitted = true;
      
      const freshState = stateManager.getQuestionState(questionId);
      expect(freshState?.selectedAnswers).toEqual([0]);
      expect(freshState?.isSubmitted).toBe(false);
    });
  });

  describe('resetApplicationState', () => {
    it('should reset all state to initial values', () => {
      // Set up some state
      stateManager.setCurrentQuestionIndex(5);
      stateManager.setTotalQuestions(10);
      stateManager.setInitialized(true);
      stateManager.updateQuestionState('question-1', {
        selectedAnswers: [0],
        isSubmitted: true,
        isCorrect: true
      });

      stateManager.resetApplicationState();
      
      const state = stateManager.getApplicationState();
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.totalQuestions).toBe(0);
      expect(state.isInitialized).toBe(false);
      expect(state.questionStates.size).toBe(0);
    });
  });

  describe('setCurrentQuestionIndex', () => {
    it('should set valid question index', () => {
      stateManager.setCurrentQuestionIndex(5);
      expect(stateManager.getCurrentQuestionIndex()).toBe(5);
    });

    it('should throw error for negative index', () => {
      expect(() => {
        stateManager.setCurrentQuestionIndex(-1);
      }).toThrow('Question index cannot be negative');
    });

    it('should throw error when index exceeds total questions', () => {
      stateManager.setTotalQuestions(5);
      
      expect(() => {
        stateManager.setCurrentQuestionIndex(5);
      }).toThrow('Question index 5 exceeds total questions 5');
    });

    it('should allow setting index when total questions is 0', () => {
      stateManager.setTotalQuestions(0);
      stateManager.setCurrentQuestionIndex(0);
      
      expect(stateManager.getCurrentQuestionIndex()).toBe(0);
    });
  });

  describe('getCurrentQuestionIndex', () => {
    it('should return current question index', () => {
      expect(stateManager.getCurrentQuestionIndex()).toBe(0);
      
      stateManager.setCurrentQuestionIndex(3);
      expect(stateManager.getCurrentQuestionIndex()).toBe(3);
    });
  });

  describe('setTotalQuestions', () => {
    it('should set valid total questions', () => {
      stateManager.setTotalQuestions(10);
      
      const state = stateManager.getApplicationState();
      expect(state.totalQuestions).toBe(10);
    });

    it('should throw error for negative total', () => {
      expect(() => {
        stateManager.setTotalQuestions(-1);
      }).toThrow('Total questions cannot be negative');
    });

    it('should adjust current index when it exceeds new total', () => {
      stateManager.setCurrentQuestionIndex(5);
      stateManager.setTotalQuestions(3);
      
      expect(stateManager.getCurrentQuestionIndex()).toBe(2);
    });

    it('should reset current index to 0 when total is 0', () => {
      stateManager.setCurrentQuestionIndex(5);
      stateManager.setTotalQuestions(0);
      
      expect(stateManager.getCurrentQuestionIndex()).toBe(0);
    });

    it('should not adjust current index when within bounds', () => {
      stateManager.setCurrentQuestionIndex(3);
      stateManager.setTotalQuestions(10);
      
      expect(stateManager.getCurrentQuestionIndex()).toBe(3);
    });
  });

  describe('setInitialized', () => {
    it('should set initialization status', () => {
      expect(stateManager.isInitialized()).toBe(false);
      
      stateManager.setInitialized(true);
      expect(stateManager.isInitialized()).toBe(true);
      
      stateManager.setInitialized(false);
      expect(stateManager.isInitialized()).toBe(false);
    });
  });

  describe('isInitialized', () => {
    it('should return initialization status', () => {
      expect(stateManager.isInitialized()).toBe(false);
      
      stateManager.setInitialized(true);
      expect(stateManager.isInitialized()).toBe(true);
    });
  });

  describe('state immutability integration', () => {
    it('should maintain immutability across multiple operations', () => {
      // Set up initial state
      stateManager.setTotalQuestions(5);
      stateManager.setCurrentQuestionIndex(2);
      stateManager.setInitialized(true);
      
      const questionState: IQuestionState = {
        selectedAnswers: [0, 1],
        isSubmitted: true,
        isCorrect: false,
        submittedAt: new Date('2023-01-01T10:00:00Z')
      };
      stateManager.updateQuestionState('question-1', questionState);
      
      // Get state snapshots
      const state1 = stateManager.getApplicationState();
      const questionState1 = stateManager.getQuestionState('question-1');
      
      // Modify returned objects
      state1.currentQuestionIndex = 999;
      state1.questionStates.clear();
      questionState1!.selectedAnswers.push(2);
      questionState1!.isCorrect = true;
      
      // Verify original state is unchanged
      const state2 = stateManager.getApplicationState();
      const questionState2 = stateManager.getQuestionState('question-1');
      
      expect(state2.currentQuestionIndex).toBe(2);
      expect(state2.questionStates.size).toBe(1);
      expect(questionState2?.selectedAnswers).toEqual([0, 1]);
      expect(questionState2?.isCorrect).toBe(false);
    });
  });
});