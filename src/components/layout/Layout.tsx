import React from 'react';
import { Header } from './Header';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  currentCategory?: string;
  totalQuestions?: number;
  currentQuestion?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentCategory,
  totalQuestions,
  currentQuestion
}) => {
  return (
    <div className="app-layout">
      <Header 
        currentCategory={currentCategory}
        totalQuestions={totalQuestions}
        currentQuestion={currentQuestion}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};