import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-card shadow p-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}
