import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { IQuestion } from '../interfaces/domain/IQuestion';
import type { IQuestionManager } from '../interfaces/services/IQuestionManager';
import './QuestionComponent.css';

/**
 * Props interface for QuestionComponent following Interface Segregation Principle
 */
export interface QuestionComponentProps {
  /** Question manager for retrieving current question data */
  questionManager: IQuestionManager;
  
  /** Whether the current question has been answered (to show/hide output) */
  isAnswered?: boolean;
  
  /** Current question index to trigger re-renders when question changes */
  currentQuestionIndex?: number;
  
  /** Optional CSS class name for styling */
  className?: string;
  
  /** Optional callback when component encounters an error */
  onError?: (error: Error) => void;
}

/**
 * React component for displaying questions and code examples in the left column.
 * Follows Single Responsibility Principle by focusing only on question display.
 * Depends on abstractions (IQuestionManager) rather than concrete implementations.
 */
export const QuestionComponent: React.FC<QuestionComponentProps> = ({
  questionManager,
  isAnswered = false,
  currentQuestionIndex = 0,
  className = '',
  onError
}) => {
  const [currentQuestion, setCurrentQuestion] = React.useState<IQuestion | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Effect to load and track current question changes
   */
  React.useEffect(() => {
    const loadCurrentQuestion = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const question = questionManager.getCurrentQuestion();
        setCurrentQuestion(question);
        
        if (!question) {
          setError('No question available to display');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load question';
        setError(errorMessage);
        
        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentQuestion();
  }, [questionManager, currentQuestionIndex, onError]);

  /**
   * Renders the question text section
   */
  const renderQuestionText = (question: IQuestion): React.ReactElement => (
    <div className="question-text-section">
      <h2 className="question-title">
        Question {questionManager.getCurrentIndex() + 1} of {questionManager.getTotalCount()}
      </h2>
      <div className="question-content">
        <p className="question-text">{question.text}</p>
      </div>

    </div>
  );

  /**
   * Renders the code example section with syntax highlighting
   * Optimized for left column constraints and mobile landscape viewing
   */
  const renderCodeExample = (question: IQuestion): React.ReactElement | null => {
    if (!question.codeExample) {
      return null;
    }

    const { code, language, output } = question.codeExample;

    return (
      <div className="code-example-section">
        <h3 className="code-example-title">Code Example</h3>
        <div className="code-example-container">
          <SyntaxHighlighter
            language={language === 'csharp' ? 'csharp' : language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '8px',
              fontSize: '16px',
              lineHeight: '1.4',
              height: '100%',
              maxHeight: 'none',
              overflow: 'auto',
              flex: 1,
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
            }}
            showLineNumbers={true}
            wrapLines={true}
            wrapLongLines={true}
            lineNumberStyle={{
              minWidth: '2em',
              paddingRight: '0.5em',
              fontSize: '14px',
              color: '#6b7280'
            }}
          >
            {code}
          </SyntaxHighlighter>
          
          {output && isAnswered && (
            <div className="code-output">
              <h4 className="code-output-title">Output:</h4>
              <pre className="code-output-content">{output}</pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renders loading state
   */
  const renderLoading = (): React.ReactElement => (
    <div className="question-loading">
      <div className="loading-spinner" />
      <p>Loading question...</p>
    </div>
  );

  /**
   * Renders error state
   */
  const renderError = (errorMessage: string): React.ReactElement => (
    <div className="question-error">
      <div className="error-icon">⚠️</div>
      <h3>Unable to Load Question</h3>
      <p>{errorMessage}</p>
    </div>
  );

  /**
   * Renders empty state when no question is available
   */
  const renderEmpty = (): React.ReactElement => (
    <div className="question-empty">
      <div className="empty-icon">📝</div>
      <h3>No Question Available</h3>
      <p>Please check if questions are properly loaded.</p>
    </div>
  );

  // Main render logic
  if (isLoading) {
    return (
      <div className={`question-component question-component--loading ${className}`}>
        {renderLoading()}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`question-component question-component--error ${className}`}>
        {renderError(error)}
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={`question-component question-component--empty ${className}`}>
        {renderEmpty()}
      </div>
    );
  }

  return (
    <div className={`question-component question-component--loaded ${className}`}>
      <div className="question-component-content">
        {renderQuestionText(currentQuestion)}
        {renderCodeExample(currentQuestion)}
      </div>
    </div>
  );
};

export default QuestionComponent;