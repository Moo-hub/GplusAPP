import React from 'react';

const ThemeToggle = () => {
  // Placeholder component for theme toggling
  const toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
  };

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      🌓
    </button>
  );
};

export default ThemeToggle;