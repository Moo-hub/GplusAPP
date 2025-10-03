#!/usr/bin/env node

/**
 * Performance Testing Runner
 * 
 * This script runs performance tests and generates reports
 * for G+ App performance monitoring.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const chalk = require('chalk');

// Configuration
const config = {
  reportDir: path.join(__dirname, '../cypress/performance'),
  baselineDir: path.join(__dirname, '../cypress/performance/baseline'),
  thresholds: {
    pageLoad: 3000,        // 3 seconds
    apiResponse: 1000,      // 1 second
    componentRender: 500,   // 500 milliseconds
    interaction: 300,       // 300 milliseconds
    firstContentfulPaint: 1800  // 1.8 seconds
  }
};

// Ensure directories exist
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

if (!fs.existsSync(config.baselineDir)) {
  fs.mkdirSync(config.baselineDir, { recursive: true });
}

/**
 * Run Cypress performance tests
 */
function runPerformanceTests() {
  console.log(chalk.blue('🚀 Starting G+ App Performance Tests'));
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  
  // Set environment variables
  const env = {
    ...process.env,
    PERFORMANCE_MONITORING: 'true',
    TEST_RUN_TIMESTAMP: timestamp
  };
  
  // Cypress command
  const cypressArgs = [
    'run',
    '--spec', 'cypress/e2e/performance*.cy.js',
    '--browser', 'chrome',
    '--config', 'video=true'
  ];
  
  // Spawn Cypress process
  const cypressProcess = spawn('npx', ['cypress', ...cypressArgs], {
    env,
    stdio: 'inherit'
  });
  
  // Handle process events
  cypressProcess.on('close', (code) => {
    if (code === 0) {
      console.log(chalk.green('✅ Performance tests completed successfully'));
      analyzeResults(timestamp);
    } else {
      console.error(chalk.red(`❌ Performance tests failed with code ${code}`));
      process.exit(code);
    }
  });
}

/**
 * Analyze performance test results
 */
function analyzeResults(timestamp) {
  console.log(chalk.blue('📊 Analyzing performance test results'));
  
  try {
    // Find the latest metrics file
    const metricsFile = path.join(config.reportDir, 'metrics.json');
    
    if (!fs.existsSync(metricsFile)) {
      console.log(chalk.yellow('⚠️ No metrics file found'));
      return;
    }
    
    const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    
    // Group metrics by name
    const groupedMetrics = {};
    metrics.forEach(metric => {
      if (!groupedMetrics[metric.name]) {
        groupedMetrics[metric.name] = [];
      }
      groupedMetrics[metric.name].push(metric);
    });
    
    // Calculate stats for each metric
    const stats = {};
    Object.keys(groupedMetrics).forEach(name => {
      const values = groupedMetrics[name].map(m => m.value);
      stats[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
        unit: groupedMetrics[name][0].unit
      };
    });
    
    // Compare against baseline
    const baselineFile = path.join(config.baselineDir, 'baseline.json');
    let baseline = {};
    let regressions = [];
    
    if (fs.existsSync(baselineFile)) {
      baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
      
      // Check for regressions
      Object.keys(stats).forEach(name => {
        if (baseline[name] && stats[name].avg > baseline[name].avg * 1.2) {
          // Performance regression of 20% or more
          regressions.push({
            name,
            current: stats[name].avg,
            baseline: baseline[name].avg,
            change: ((stats[name].avg - baseline[name].avg) / baseline[name].avg * 100).toFixed(2) + '%',
            unit: stats[name].unit
          });
        }
      });
    }
    
    // Print performance summary
    console.log(chalk.blue('\n📈 Performance Summary'));
    console.table(
      Object.keys(stats).map(name => ({
        Metric: name,
        Average: `${stats[name].avg.toFixed(2)} ${stats[name].unit}`,
        Min: `${stats[name].min.toFixed(2)} ${stats[name].unit}`,
        Max: `${stats[name].max.toFixed(2)} ${stats[name].unit}`,
        Count: stats[name].count,
        Baseline: baseline[name] ? `${baseline[name].avg.toFixed(2)} ${stats[name].unit}` : 'N/A',
        Change: baseline[name] ? `${((stats[name].avg - baseline[name].avg) / baseline[name].avg * 100).toFixed(2)}%` : 'N/A'
      }))
    );
    
    // Check for threshold violations
    const violations = [];
    
    if (stats.page_load_total && stats.page_load_total.avg > config.thresholds.pageLoad) {
      violations.push(`Page load time (${stats.page_load_total.avg.toFixed(2)}ms) exceeds threshold (${config.thresholds.pageLoad}ms)`);
    }
    
    if (stats.api_response_time && stats.api_response_time.avg > config.thresholds.apiResponse) {
      violations.push(`API response time (${stats.api_response_time.avg.toFixed(2)}ms) exceeds threshold (${config.thresholds.apiResponse}ms)`);
    }
    
    if (stats.component_render_time && stats.component_render_time.avg > config.thresholds.componentRender) {
      violations.push(`Component render time (${stats.component_render_time.avg.toFixed(2)}ms) exceeds threshold (${config.thresholds.componentRender}ms)`);
    }
    
    if (stats.interaction_time && stats.interaction_time.avg > config.thresholds.interaction) {
      violations.push(`Interaction time (${stats.interaction_time.avg.toFixed(2)}ms) exceeds threshold (${config.thresholds.interaction}ms)`);
    }
    
    if (stats.firstContentfulPaint && stats.firstContentfulPaint.avg > config.thresholds.firstContentfulPaint) {
      violations.push(`First contentful paint (${stats.firstContentfulPaint.avg.toFixed(2)}ms) exceeds threshold (${config.thresholds.firstContentfulPaint}ms)`);
    }
    
    // Show performance regressions
    if (regressions.length > 0) {
      console.log(chalk.yellow('\n⚠️ Performance Regressions Detected'));
      console.table(regressions);
    }
    
    // Show threshold violations
    if (violations.length > 0) {
      console.log(chalk.red('\n❌ Performance Threshold Violations'));
      violations.forEach(v => console.log(chalk.red(`  - ${v}`)));
      
      if (process.env.ENFORCE_PERFORMANCE_BUDGETS === 'true') {
        console.log(chalk.red('\n❌ Performance budget enforcement is enabled, failing build'));
        process.exit(1);
      }
    }
    
    // Update baseline if requested
    if (process.env.UPDATE_BASELINE === 'true') {
      console.log(chalk.blue('\n💾 Updating performance baseline'));
      fs.writeFileSync(baselineFile, JSON.stringify(stats, null, 2));
    }
    
    console.log(chalk.green('\n✅ Performance analysis complete'));
    console.log(chalk.blue(`📊 Full report available at: ${path.join(config.reportDir, 'performance-report.html')}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Error analyzing performance results:'), error);
  }
}

// Execute
runPerformanceTests();