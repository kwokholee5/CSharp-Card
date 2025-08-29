// Concrete implementation of IProgressTracker using localStorage
// Observer Pattern implementation for progress notifications
// Single Responsibility - handles only progress persistence and tracking

import type { Question, UserProgress, StudySession } from '../../utils/types';
import type { 
  IProgressTracker, 
  IProgressObserver, 
  ProgressUpdate, 
  StudyMetrics 
} from './IProgressTracker';
import type { ValidationResult, AnswerSubmission } from './IAnswerValidator';

const STORAGE_KEYS = {
  PROGRESS: 'csharp-cards-progress',
  SESSIONS: 'csharp-cards-sessions',
  CURRENT_SESSION: 'csharp-cards-current-session'
} as const;

export class LocalStorageProgressTracker implements IProgressTracker {
  private observers: Set<IProgressObserver> = new Set();
  private progressCache: Map<string, UserProgress> = new Map();
  private sessionsCache: Map<string, StudySession> = new Map();
  private currentSessionId: string | null = null;

  constructor() {
    this.loadProgressFromStorage();
    this.loadSessionsFromStorage();
  }

  // Progress tracking methods

  public async updateProgress(
    question: Question,
    submission: AnswerSubmission,
    result: ValidationResult,
    sessionId: string
  ): Promise<UserProgress> {
    const existingProgress = await this.getProgress(question.id);
    const now = new Date();

    const newProgress: UserProgress = {
      questionId: question.id,
      knownCount: existingProgress?.knownCount || 0,
      unknownCount: existingProgress?.unknownCount || 0,
      lastStudied: now.toISOString(),
      difficulty: question.difficulty,
      consecutiveCorrect: existingProgress?.consecutiveCorrect || 0,
      averageTime: this.calculateAverageTime(existingProgress, submission.timeSpent),
      isFavorite: existingProgress?.isFavorite || false,
      nextReview: this.calculateNextReview({
        ...existingProgress,
        questionId: question.id
      } as UserProgress).toISOString()
    };

    // Update counts and streaks
    if (result.isCorrect) {
      newProgress.knownCount++;
      newProgress.consecutiveCorrect = (existingProgress?.consecutiveCorrect || 0) + 1;
    } else {
      newProgress.unknownCount++;
      newProgress.consecutiveCorrect = 0;
    }

    // Update cache and storage
    this.progressCache.set(question.id, newProgress);
    await this.saveProgressToStorage();

    // Update session stats
    await this.updateSessionStats(sessionId, result, submission.timeSpent);

    // Notify observers
    const update: ProgressUpdate = {
      questionId: question.id,
      previousProgress: existingProgress,
      newProgress,
      sessionId,
      timestamp: now
    };

    this.notifyObservers(observer => observer.onProgressUpdate(update));

    return newProgress;
  }

  public async getProgress(questionId: string): Promise<UserProgress | null> {
    return this.progressCache.get(questionId) || null;
  }

  public async getBulkProgress(questionIds: string[]): Promise<Map<string, UserProgress>> {
    const result = new Map<string, UserProgress>();
    
    for (const id of questionIds) {
      const progress = this.progressCache.get(id);
      if (progress) {
        result.set(id, progress);
      }
    }
    
    return result;
  }

  public calculateNextReview(progress: UserProgress): Date {
    const baseInterval = 1; // 1 day
    const difficultyMultiplier = Math.max(0.5, (11 - progress.difficulty) / 10);
    const performanceMultiplier = Math.max(0.5, progress.consecutiveCorrect / 5);
    
    const intervalDays = baseInterval * difficultyMultiplier * performanceMultiplier;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + Math.ceil(intervalDays));
    
    return nextReview;
  }

  public async getDueForReview(limit: number = 20): Promise<UserProgress[]> {
    const now = new Date();
    const dueProgress: UserProgress[] = [];

    for (const progress of this.progressCache.values()) {
      if (progress.nextReview && new Date(progress.nextReview) <= now) {
        dueProgress.push(progress);
      }
    }

    // Sort by priority: overdue first, then by difficulty
    dueProgress.sort((a, b) => {
      const aDaysOverdue = this.getDaysOverdue(a);
      const bDaysOverdue = this.getDaysOverdue(b);
      
      if (aDaysOverdue !== bDaysOverdue) {
        return bDaysOverdue - aDaysOverdue; // More overdue first
      }
      
      return b.difficulty - a.difficulty; // Higher difficulty first
    });

    return dueProgress.slice(0, limit);
  }

  // Session management methods

  public async startSession(
    sessionType: StudySession['sessionType'],
    categories: string[]
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const session: StudySession = {
      id: sessionId,
      startTime: new Date(),
      cardsStudied: 0,
      correctAnswers: 0,
      timePerCard: [],
      categories,
      sessionType
    };

    this.sessionsCache.set(sessionId, session);
    this.currentSessionId = sessionId;
    
    await this.saveSessionsToStorage();
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);

    this.notifyObservers(observer => observer.onSessionStart(session));

    return sessionId;
  }

  public async endSession(sessionId: string): Promise<StudyMetrics> {
    const session = this.sessionsCache.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.endTime = new Date();
    this.sessionsCache.set(sessionId, session);

    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }

    await this.saveSessionsToStorage();

    const metrics = this.calculateSessionMetrics(session);
    this.notifyObservers(observer => observer.onSessionEnd(session, metrics));

    return metrics;
  }

  public async getSessionMetrics(sessionId: string): Promise<StudyMetrics> {
    const session = this.sessionsCache.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return this.calculateSessionMetrics(session);
  }

  // Observer pattern implementation

  public subscribe(observer: IProgressObserver): void {
    this.observers.add(observer);
  }

  public unsubscribe(observer: IProgressObserver): void {
    this.observers.delete(observer);
  }

  // Data management methods

  public async resetProgress(questionId: string): Promise<void> {
    this.progressCache.delete(questionId);
    await this.saveProgressToStorage();
  }

  public async exportProgress(): Promise<Record<string, UserProgress>> {
    const result: Record<string, UserProgress> = {};
    
    for (const [id, progress] of this.progressCache) {
      result[id] = progress;
    }
    
    return result;
  }

  public async importProgress(progressData: Record<string, UserProgress>): Promise<void> {
    this.progressCache.clear();
    
    for (const [id, progress] of Object.entries(progressData)) {
      this.progressCache.set(id, progress);
    }
    
    await this.saveProgressToStorage();
  }

  // Private helper methods

  private calculateAverageTime(existing: UserProgress | null, newTime: number): number {
    if (!existing) {
      return newTime;
    }

    const totalAttempts = existing.knownCount + existing.unknownCount;
    const currentAverage = existing.averageTime;
    
    return ((currentAverage * totalAttempts) + newTime) / (totalAttempts + 1);
  }

  private async updateSessionStats(
    sessionId: string,
    result: ValidationResult,
    timeSpent: number
  ): Promise<void> {
    const session = this.sessionsCache.get(sessionId);
    if (!session) {
      return;
    }

    session.cardsStudied++;
    if (result.isCorrect) {
      session.correctAnswers++;
    }
    session.timePerCard.push(timeSpent);

    this.sessionsCache.set(sessionId, session);
    await this.saveSessionsToStorage();
  }

  private calculateSessionMetrics(session: StudySession): StudyMetrics {
    const totalQuestions = session.cardsStudied;
    const correctAnswers = session.correctAnswers;
    const accuracyRate = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    const averageTime = session.timePerCard.length > 0 
      ? session.timePerCard.reduce((sum, time) => sum + time, 0) / session.timePerCard.length
      : 0;

    return {
      totalQuestions,
      correctAnswers,
      averageTime,
      accuracyRate,
      difficultyDistribution: this.calculateDifficultyDistribution(),
      categoryPerformance: this.calculateCategoryPerformance(session.categories)
    };
  }

  private calculateDifficultyDistribution(): Record<number, number> {
    const distribution: Record<number, number> = {};
    
    for (const progress of this.progressCache.values()) {
      const difficulty = progress.difficulty;
      distribution[difficulty] = (distribution[difficulty] || 0) + 1;
    }
    
    return distribution;
  }

  private calculateCategoryPerformance(categories: string[]): Record<string, { correct: number; total: number }> {
    // This would require category information in progress data
    // For now, return empty performance data
    const performance: Record<string, { correct: number; total: number }> = {};
    
    for (const category of categories) {
      performance[category] = { correct: 0, total: 0 };
    }
    
    return performance;
  }

  private getDaysOverdue(progress: UserProgress): number {
    if (!progress.nextReview) return 0;
    
    const now = new Date();
    const reviewDate = new Date(progress.nextReview);
    const diffMs = now.getTime() - reviewDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyObservers(callback: (observer: IProgressObserver) => void): void {
    this.observers.forEach(callback);
  }

  // Storage methods

  private loadProgressFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (stored) {
        const progressData: Record<string, UserProgress> = JSON.parse(stored);
        this.progressCache.clear();
        
        for (const [id, progress] of Object.entries(progressData)) {
          this.progressCache.set(id, progress);
        }
      }
    } catch (error) {
      console.warn('Failed to load progress from storage:', error);
    }
  }

  private async saveProgressToStorage(): Promise<void> {
    try {
      const progressData: Record<string, UserProgress> = {};
      
      for (const [id, progress] of this.progressCache) {
        progressData[id] = progress;
      }
      
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressData));
    } catch (error) {
      console.error('Failed to save progress to storage:', error);
    }
  }

  private loadSessionsFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (stored) {
        const sessionsData: Record<string, StudySession> = JSON.parse(stored);
        this.sessionsCache.clear();
        
        for (const [id, session] of Object.entries(sessionsData)) {
          // Convert date strings back to Date objects
          session.startTime = new Date(session.startTime);
          if (session.endTime) {
            session.endTime = new Date(session.endTime);
          }
          this.sessionsCache.set(id, session);
        }
      }

      const currentSessionId = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (currentSessionId && this.sessionsCache.has(currentSessionId)) {
        this.currentSessionId = currentSessionId;
      }
    } catch (error) {
      console.warn('Failed to load sessions from storage:', error);
    }
  }

  private async saveSessionsToStorage(): Promise<void> {
    try {
      const sessionsData: Record<string, StudySession> = {};
      
      for (const [id, session] of this.sessionsCache) {
        sessionsData[id] = session;
      }
      
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessionsData));
    } catch (error) {
      console.error('Failed to save sessions to storage:', error);
    }
  }
}