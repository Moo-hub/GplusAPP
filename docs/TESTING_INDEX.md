# G+ App Testing Infrastructure

This directory contains comprehensive documentation for the G+ App testing infrastructure. Below you'll find an index of available documents and guides.

## Testing Documentation Index

- [Testing Infrastructure Overview](./TESTING_INFRASTRUCTURE.md) - Comprehensive overview of the testing architecture
- [Performance Monitoring](./PERFORMANCE_MONITORING.md) - Guide to performance testing and monitoring
- [Visual Regression Testing](./VISUAL_REGRESSION_TESTING.md) - Documentation for visual testing
- [Component Testing](./COMPONENT_TESTING.md) - Guide to testing individual React components
- [Accessibility Testing](./ACCESSIBILITY_TESTING.md) - Guide to accessibility testing with Cypress-axe

## Key Testing Features

1. **Custom Reporters**:
   - HTML Reports with detailed test results
   - Dashboard Metrics for performance tracking
   - Visual Regression reports for UI comparison

2. **Performance Testing**:
   - Page load performance metrics
   - Component rendering performance
   - API response time monitoring
   - Resource loading optimization

3. **Visual Regression Testing**:
   - Automated screenshot comparison
   - Visual diff highlighting
   - Baseline management

4. **Component Testing**:
   - Isolated React component testing
   - State and prop validation
   - Event handling verification

5. **Accessibility Testing**:
   - WCAG compliance verification
   - Accessibility violation reporting
   - Remediation suggestions

## Getting Started

To run the tests locally:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run only performance tests
npm run test:performance

# Run only visual regression tests
npm run test:visual

# Run only component tests
npm run test:components

# Run only accessibility tests
npm run test:accessibility
```

## CI/CD Integration

The testing infrastructure is designed to integrate seamlessly with CI/CD pipelines. See [CI Integration Guide](./CI_INTEGRATION.md) for details on how to configure GitHub Actions or other CI providers.
