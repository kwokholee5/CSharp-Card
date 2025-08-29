import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  currentCategory?: string;
  totalQuestions?: number;
  currentQuestion?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  totalQuestions,
  currentQuestion
}) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <span className="logo-icon">💻</span>
            <span className="logo-text">C# Cards</span>
          </Link>
        </div>
        
        <nav className="header-nav">
          <Link to="/study" className="nav-link">Study</Link>
          <Link to="/browse" className="nav-link">Browse</Link>
          <Link to="/progress" className="nav-link">Progress</Link>
        </nav>
        
        <div className="header-right">
          {currentCategory && totalQuestions && currentQuestion && (
            <div className="study-progress">
              <span className="category-badge">{currentCategory}</span>
              <span className="progress-text">
                {currentQuestion} / {totalQuestions}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};