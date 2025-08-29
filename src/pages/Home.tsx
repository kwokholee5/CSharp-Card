import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export const Home: React.FC = () => {
  const categories = [
    { 
      id: 'basics', 
      name: 'C# Basics', 
      icon: '📘', 
      description: 'Variables, data types, operators',
      questions: 10,
      difficulty: 'Beginner'
    },
    { 
      id: 'intermediate', 
      name: 'Intermediate', 
      icon: '📗', 
      description: 'OOP, Collections, LINQ',
      questions: 0,
      difficulty: 'Intermediate'
    },
    { 
      id: 'advanced', 
      name: 'Advanced', 
      icon: '📕', 
      description: 'Async, Generics, Delegates',
      questions: 0,
      difficulty: 'Advanced'
    },
    { 
      id: 'expert', 
      name: 'Expert', 
      icon: '📙', 
      description: 'Performance, Design Patterns',
      questions: 0,
      difficulty: 'Expert'
    }
  ];

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">
          Master C# Interview Questions
        </h1>
        <p className="hero-subtitle">
          Practice with interactive revision cards to ace your technical interviews
        </p>
        <Link to="/study" className="cta-button">
          Start Studying →
        </Link>
      </div>

      <div className="categories-section">
        <h2 className="section-title">Choose Your Level</h2>
        <div className="categories-grid">
          {categories.map(category => (
            <Link 
              key={category.id} 
              to={`/study?category=${category.id}`}
              className="category-card"
            >
              <div className="category-icon">{category.icon}</div>
              <h3 className="category-name">{category.name}</h3>
              <p className="category-description">{category.description}</p>
              <div className="category-meta">
                <span className="question-count">{category.questions} questions</span>
                <span className="difficulty-badge">{category.difficulty}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Interactive Cards</h3>
            <p>Flip cards to reveal answers with smooth animations</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Monitor your learning with detailed statistics</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Smart Search</h3>
            <p>Find questions by keywords, tags, or difficulty</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3>Works Offline</h3>
            <p>Study anywhere with offline support</p>
          </div>
        </div>
      </div>
    </div>
  );
};