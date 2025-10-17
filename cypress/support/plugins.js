// This file contains setup for Node events processed by Cypress
// You can use this file to load plugins, register event listeners, etc.
// See: https://docs.cypress.io/guides/tooling/plugins-guide

// Import performance monitoring setup
const { setupPerformanceMonitoring } = require('./performance-monitoring');

module.exports = (on, config) => {
  // `on` is used to hook into various Cypress events
  // `config` is the resolved Cypress config

  // Register screenshot/video recording behavior
  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.name === 'chrome') {
      // Adjust Chrome recording settings
      launchOptions.args.push('--disable-dev-shm-usage');
      
      // Enable more accurate performance metrics in Chrome
      launchOptions.args.push('--enable-precise-memory-info');
      launchOptions.args.push('--js-flags=--expose-gc');
      
      return launchOptions;
    }
  });

  // Set up standard tasks
  on('task', {
    log(message) {
      console.log(message);
      return null;
    },
    table(data) {
      console.table(data);
      return null;
    }
  });
  
  // Set up performance monitoring if enabled
  if (config.env.PERFORMANCE_MONITORING !== 'false') {
    setupPerformanceMonitoring(on, config);
  }

  // Return the config object
  return config;
};