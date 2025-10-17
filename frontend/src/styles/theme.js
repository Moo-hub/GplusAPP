export const lightTheme = {
  colors: {
    primary: '#38a169',
    primaryDark: '#2f855a',
    secondary: '#e2e8f0',
    secondaryDark: '#cbd5e0',
    danger: '#e53e3e',
    dangerDark: '#c53030',
    background: '#f0fdf4',
    card: '#ffffff',
    cardDark: '#2f855a',
    text: '#1a202c',
    textLight: '#ffffff',
    border: '#e2e8f0',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.08)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.12)',
    large: '0 10px 15px rgba(0, 0, 0, 0.15)',
  },
  radii: {
    small: '4px',
    medium: '8px',
    large: '16px',
    round: '9999px',
  },
  space: {
    small: '8px',
    medium: '16px',
    large: '24px',
    xlarge: '32px',
  }
};

export const darkTheme = {
  colors: {
    primary: '#4ade80',
    primaryDark: '#38a169',
    secondary: '#4a5568',
    secondaryDark: '#2d3748',
    danger: '#f56565',
    dangerDark: '#e53e3e',
    background: '#1a202c',
    card: '#2d3748',
    cardDark: '#4a5568',
    text: '#f7fafc',
    textLight: '#ffffff',
    border: '#4a5568',
  },
  fonts: lightTheme.fonts,
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.24)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.36)',
    large: '0 10px 15px rgba(0, 0, 0, 0.40)',
  },
  radii: lightTheme.radii,
  space: lightTheme.space
};

export default lightTheme;