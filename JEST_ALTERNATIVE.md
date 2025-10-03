# Running Tests with Vite & Jest Alternative

Since we're experiencing issues with the Vitest configuration, here's an alternative approach using Jest that can be set up alongside the existing configuration:

```json
// package.json additions for Jest
{
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^14.0.0"
  },
  "scripts": {
    "jest": "jest",
    "test:alt": "jest"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/src/setupTests.js"],
    "moduleNameMapper": {
      "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js"
    },
    "transform": {
      "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
    }
  }
}
```

## Setting Up Mock Files

Create these mock files to handle non-JavaScript imports:

```javascript
// __mocks__/styleMock.js
module.exports = {};
```

```javascript
// __mocks__/fileMock.js
module.exports = 'test-file-stub';
```

## Babel Configuration

Add a simple Babel configuration for Jest:

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-react'
  ]
};
```

## Converting Tests

When converting Vitest tests to Jest:

1. Change `import { describe, it, expect } from 'vitest'` to Jest globals (no import needed)
2. Change `it.skip` to `test.skip`
3. Update any Vitest-specific assertions to Jest equivalents

## Running Tests

Install Jest dependencies and run:

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/jest-dom @testing-library/react @babel/preset-env @babel/preset-react babel-jest
npm run test:alt
```

This approach allows you to run tests while fixing the Vitest configuration issues.