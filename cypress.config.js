const { defineConfig } = require("cypress");
const codeCoverageTask = require('@cypress/code-coverage/task');
const fs = require('fs');
const path = require('path');

// Import custom reporters
const GplusReporter = require('./cypress/reporters/gplus-reporter');
const GplusHtmlReporter = require('./cypress/reporters/gplus-html-reporter');
const GplusDashboardReporter = require('./cypress/reporters/gplus-dashboard-reporter');
const GplusVisualRegressionReporter = require('./cypress/reporters/gplus-visual-regression-reporter');

// Ensure directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create necessary directories
ensureDirectoryExists(path.join(__dirname, 'cypress/reports'));
ensureDirectoryExists(path.join(__dirname, 'cypress/reports/junit'));
ensureDirectoryExists(path.join(__dirname, 'cypress/reports/html'));
ensureDirectoryExists(path.join(__dirname, 'cypress/performance'));
ensureDirectoryExists(path.join(__dirname, 'cypress/screenshots/baseline'));

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Load plugins file
      require('./cypress/support/plugins')(on, config);
      
      // Set up code coverage
      codeCoverageTask(on, config);
      
      // Configure custom reporters
      require('mocha-multi-reporters');
      
      // Set up the reporter options
      config.reporter = 'cypress-multi-reporters';
      config.reporterOptions = {
        reporterEnabled: 'spec, mocha-junit-reporter',
        mochaJunitReporterReporterOptions: {
          mochaFile: 'cypress/reports/junit/results-[hash].xml',
          toConsole: false
        },
        cypressReporterReporterOptions: {
          configFile: 'reporter-config.json'
        }
      };
      
      // Set up custom test hooks
      on('before:run', (details) => {
        console.log('Starting test run with browser:', details.browser?.name);
        
        // Create timestamp for this test run
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        config.env.TEST_RUN_TIMESTAMP = timestamp;
        
        // Create directory for this test run's performance data if needed
        const runDir = path.join(__dirname, 'cypress/performance', timestamp);
        if (!fs.existsSync(runDir)) {
          fs.mkdirSync(runDir, { recursive: true });
        }
      });
      
      on('after:run', (results) => {
        console.log(`Test run completed: ${results.totalTests} tests, ${results.totalPassed} passed, ${results.totalFailed} failed`);
        
        // Generate performance report
        if (config.env.PERFORMANCE_MONITORING !== 'false') {
          try {
            on('task', { generatePerformanceReport: true });
            console.log('Performance report generated');
          } catch (e) {
            console.error('Error generating performance report:', e);
          }
        }
      });
      
      on('after:screenshot', (details) => {
        // Process screenshot for visual regression if enabled
        if (config.env.VISUAL_TESTING === 'true') {
          console.log(`Screenshot taken: ${details.path}`);
        }
        return details;
      });
      
      return config;
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: process.env.CI === 'true',
    videoCompression: 32,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    experimentalMemoryManagement: true
  },
  env: {
    apiUrl: process.env.API_URL || 'http://localhost:8000/api',
    coverage: true,
    codeCoverageTasksRegistered: true,
    VISUAL_TESTING: process.env.VISUAL_TESTING || 'false',
    RECORD_METRICS: process.env.RECORD_METRICS || 'true',
    PERFORMANCE_MONITORING: process.env.PERFORMANCE_MONITORING || 'true',
    PERFORMANCE_THRESHOLDS: {
      // Performance budgets
      pageLoad: 3000,         // 3 seconds
      apiResponse: 1000,      // 1 second
      componentRender: 500,   // 500 milliseconds
      interaction: 300,       // 300 milliseconds
      firstContentfulPaint: 1800  // 1.8 seconds
    }
  },
  retries: {
    runMode: process.env.CI === 'true' ? 2 : 1,
    openMode: 0,
  },
  projectId: 'gplusapp',
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}'
  }
});