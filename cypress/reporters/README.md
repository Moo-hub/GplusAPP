# G+ App Cypress Test Reporters

This directory contains custom test reporters for the G+ App Cypress test suite. These reporters enhance the test output with better formatting, detailed reports, metrics, and visual regression testing capabilities.

## Available Reporters

### 1. Basic Reporter (`gplus-reporter.js`)

The standard console reporter with enhanced formatting and error reporting. It provides:

- Colorized test output in the console
- Summary statistics at the end of test runs
- Improved error formatting for easier debugging
- Runtime performance tracking

Usage: This reporter is included by default in the standard test run.

### 2. HTML Reporter (`gplus-html-reporter.js`)

Generates a comprehensive HTML report with detailed test results:

- Full test results with pass/fail status
- Test duration information
- Expandable error details with stack traces
- Code snippets for failed tests
- Filterable and searchable results

Usage:
```
npm run cy:html-report
```

Output: `cypress/reports/html/test-results.html`

### 3. Dashboard Reporter (`gplus-dashboard-reporter.js`)

Generates metrics and visualization for test performance over time:

- Historical test data tracking
- Pass rate trends
- Test duration trends
- Category-based metrics
- Interactive charts and visualizations

Usage:
```
npm run cy:dashboard
```

Output: `cypress/dashboard/metrics.json` and `cypress/dashboard/index.html`

### 4. Visual Regression Reporter (`gplus-visual-regression-reporter.js`)

A specialized reporter for visual testing that:

- Compares screenshots against baseline images
- Highlights visual differences
- Provides side-by-side comparison
- Generates visual diff reports
- Manages baseline images

Usage:
```
npm run cy:visual
```

Output: `cypress/visual-reports/visual-report.html`

## Configuration

Each reporter can be configured via the corresponding configuration files:

- `reporter-config.json` - Default reporter configuration
- `reporter-html-config.json` - HTML reporter configuration
- `reporter-dashboard-config.json` - Dashboard reporter configuration
- `reporter-visual-config.json` - Visual regression reporter configuration

## Implementation Details

### Reporter Architecture

Each reporter implements the Mocha reporter interface, capturing test events:

- `EVENT_RUN_BEGIN` - Test run starts
- `EVENT_RUN_END` - Test run completes
- `EVENT_SUITE_BEGIN` - Test suite starts
- `EVENT_SUITE_END` - Test suite completes
- `EVENT_TEST_PASS` - Test passes
- `EVENT_TEST_FAIL` - Test fails
- `EVENT_TEST_PENDING` - Test is skipped

### Visual Regression Testing

The visual regression reporter:

1. Captures screenshots during tests
2. Stores baseline images in `cypress/visual-reports/baseline`
3. Compares new screenshots with baselines
4. Generates pixel-by-pixel diffs
5. Creates HTML report with comparison results

### Dashboard Metrics

The dashboard reporter:

1. Tracks test results over time
2. Categorizes tests by type
3. Stores historical data in `cypress/dashboard/history.json`
4. Generates visualizations with Chart.js
5. Provides trend analysis for test performance

## Extending Reporters

To extend or customize the reporters:

1. Modify the relevant reporter file
2. Update the corresponding configuration file
3. Add any new metrics or visualizations as needed
4. Update the CSS styling for visual changes

## CI Integration

The reporters are configured for CI integration via GitHub Actions:

- Reports are generated automatically on CI runs
- Artifacts are uploaded and preserved
- GitHub Pages can be used to host the reports
- PR comments include links to the reports

For more details, see the [Test Reporting Guide](../docs/TEST_REPORTING_GUIDE.md).