# Vitest VS Code Integration Guide

🎉 **Success!** The VS Code Vitest extension is now recognizing your test configurations. The extension output shows it's loading configurations from:

- `vitest.react.config.js`
- `vitest.simple.config.js`
- `vitest.config.ts`
- `vitest.config.js`
- and others

## Using VS Code for Testing

### Running Tests

1. **From Test Explorer**:
   - Open the Testing panel in VS Code (flask icon in the sidebar)
   - Click the play button next to tests or test files
   - Use the "Run All Tests" button at the top of the panel

2. **From Command Palette**:
   - Press `Ctrl+Shift+P`
   - Type "Vitest: Run Test at Cursor" when in a test file
   - Or "Vitest: Run Current Test File"

### Debugging Tests

We've added VS Code launch configurations for debugging:

- "Debug Current Test File" - Debug the file you're currently editing
- "Debug All Tests" - Run and debug all tests
- "Debug Basic Tests" - Run only the basic test files we've created

To use them:

1. Open the "Run and Debug" panel in VS Code (play icon with bug)
2. Select a configuration from the dropdown
3. Click the green play button or press F5

## Available Test Commands

- `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:basic` - Run only the basic test files
- `npm run test:ui` - Open the Vitest UI for visual test running

## Configuration Files

We have several configuration files, each with specific purposes:

1. **Main Configurations** (recognized by VS Code):
   - `vitest.config.js` - Standard configuration with jsdom environment
   - `vitest.config.ts` - TypeScript version (same settings)
   - `vitest.conf.js` - Used for compatibility with some tools

2. **Specialized Configurations**:
   - `vitest.react.config.js` - Includes React plugin for more complex React testing
   - `vitest.simple.config.js` - Minimal configuration for basic testing
   - `vitest-basic.config.js` - Simplified config for debugging

3. **Setup Files**:
   - `vitest.setup.js` - Main setup file with browser API mocks
   - `src/setupTests.minimal.js` - Alternative minimal setup

## Best Practices

1. **For Simple Tests**:
   - Use the main `vitest.config.js` with our custom `vitest.setup.js`
   - Works for basic JavaScript and simple React component tests

2. **For Complex React Tests**:
   - Use `vitest.react.config.js` which includes the React plugin
   - May require additional mocks for specific React features

3. **When Tests Fail**:
   - Start with basic tests to ensure configuration is working
   - Gradually extend the mocks in `vitest.setup.js` as needed
   - Consider using `vi.mock()` for specific module mocks within tests

## Next Steps

The infrastructure is now set up correctly! As you move forward:

1. Focus on fixing complex tests one at a time
2. Extend the mock implementations as needed for specific browser APIs
3. Leverage the debugging capabilities in VS Code to pinpoint issues

Remember that tests in the `tests/` directory might need additional configuration or mocks depending on their complexity.
