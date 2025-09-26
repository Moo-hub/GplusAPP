module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#1B5E20',
          DEFAULT: '#2E7D32',
          light: '#66BB6A',
        },
        white: '#FFFFFF',
      },
      borderRadius: {
        card: '1.25rem',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
