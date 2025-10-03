// Theme toggle component

const ThemeToggle = () => {
  // Placeholder component for theme toggling
  const toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
  };

  return (
    <button className="theme-toggle" onClick={toggleTheme} data-testid="theme-toggle-button">
      🌓
    </button>
  );
};

export default ThemeToggle;