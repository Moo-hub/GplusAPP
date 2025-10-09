#!/usr/bin/env node

/**
 * Advanced Performance Testing Runner
 * 
 * This script runs advanced performance tests focused on
 * user interaction patterns and complex flows.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const config = {
  reportDir: path.join(__dirname, '../cypress/performance'),
  advancedMetricsFile: path.join(__dirname, '../cypress/performance/advanced-metrics.json'),
  thresholds: {
    flowTotalTime: 5000,       // 5 seconds for a complete flow
    flowStepTime: 1000,        // 1 second per step
    flowEfficiency: 60,        // At least 60% efficiency
    layoutStability: 0.1,      // Layout stability score under 0.1
    memoryGrowth: 10           // Less than 10MB growth
  }
};

// Ensure directories exist
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

/**
 * Run Advanced Performance Tests
 */
function runAdvancedTests() {
  console.log(chalk.blue('🚀 Starting G+ App Advanced Performance Tests'));
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  
  // Set environment variables
  const env = {
    ...process.env,
    PERFORMANCE_MONITORING: 'true',
    ADVANCED_METRICS: 'true',
    TEST_RUN_TIMESTAMP: timestamp
  };
  
  // Cypress command
  const cypressArgs = [
    'run',
    '--spec', 'cypress/e2e/performance-advanced.cy.js',
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
      console.log(chalk.green('✅ Advanced performance tests completed successfully'));
      analyzeAdvancedResults();
    } else {
      console.error(chalk.red(`❌ Advanced performance tests failed with code ${code}`));
      process.exit(code);
    }
  });
}

/**
 * Analyze advanced performance test results
 */
function analyzeAdvancedResults() {
  console.log(chalk.blue('📊 Analyzing advanced performance metrics'));
  
  try {
    // Find the metrics file
    const metricsFile = path.join(config.reportDir, 'metrics.json');
    
    if (!fs.existsSync(metricsFile)) {
      console.log(chalk.yellow('⚠️ No metrics file found'));
      return;
    }
    
    const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    
    // Filter for advanced metrics
    const advancedMetrics = metrics.filter(metric => 
      metric.name.startsWith('flow_') || 
      metric.name === 'layout_stability_score' ||
      metric.name === 'memory_growth' ||
      metric.name === 'first_contentful_paint' ||
      metric.name.includes('benchmark')
    );
    
    // Save advanced metrics to a separate file
    fs.writeFileSync(
      config.advancedMetricsFile,
      JSON.stringify(advancedMetrics, null, 2)
    );
    
    // Group by metric name
    const groupedMetrics = {};
    advancedMetrics.forEach(metric => {
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
    
    // Print advanced performance summary
    console.log(chalk.blue('\n📈 Advanced Performance Summary'));
    
    // Format the data for console.table
    const tableData = Object.keys(stats).map(name => ({
      Metric: name,
      Average: `${stats[name].avg.toFixed(2)} ${stats[name].unit}`,
      Min: `${stats[name].min.toFixed(2)} ${stats[name].unit}`,
      Max: `${stats[name].max.toFixed(2)} ${stats[name].unit}`,
      Count: stats[name].count
    }));
    
    console.table(tableData);
    
    // Check for threshold violations
    const violations = [];
    
    if (stats.flow_total_time && stats.flow_total_time.avg > config.thresholds.flowTotalTime) {
      violations.push(`Flow total time (${stats.flow_total_time.avg.toFixed(2)}ms) exceeds threshold (${config.thresholds.flowTotalTime}ms)`);
    }
    
    if (stats.flow_step_time && stats.flow_step_time.avg > config.thresholds.flowStepTime) {
      violations.push(`Flow step time (${stats.flow_step_time.avg.toFixed(2)}ms) exceeds threshold (${config.thresholds.flowStepTime}ms)`);
    }
    
    if (stats.flow_efficiency && stats.flow_efficiency.avg < config.thresholds.flowEfficiency) {
      violations.push(`Flow efficiency (${stats.flow_efficiency.avg.toFixed(2)}%) below threshold (${config.thresholds.flowEfficiency}%)`);
    }
    
    if (stats.layout_stability_score && stats.layout_stability_score.avg > config.thresholds.layoutStability) {
      violations.push(`Layout stability score (${stats.layout_stability_score.avg.toFixed(4)}) exceeds threshold (${config.thresholds.layoutStability})`);
    }
    
    if (stats.memory_growth && stats.memory_growth.avg > config.thresholds.memoryGrowth) {
      violations.push(`Memory growth (${stats.memory_growth.avg.toFixed(2)}MB) exceeds threshold (${config.thresholds.memoryGrowth}MB)`);
    }
    
    // Show threshold violations
    if (violations.length > 0) {
      console.log(chalk.red('\n❌ Advanced Performance Threshold Violations'));
      violations.forEach(v => console.log(chalk.red(`  - ${v}`)));
      
      if (process.env.ENFORCE_PERFORMANCE_BUDGETS === 'true') {
        console.log(chalk.red('\n❌ Performance budget enforcement is enabled, failing build'));
        process.exit(1);
      }
    } else {
      console.log(chalk.green('\n✅ All advanced performance metrics within acceptable thresholds'));
    }
    
    // Flow analysis
    if (groupedMetrics.flow_total_time) {
      console.log(chalk.blue('\n🔄 Interaction Flow Analysis'));
      
      // Group by flow name
      const flowMetrics = groupedMetrics.flow_total_time;
      const flowsByName = {};
      
      flowMetrics.forEach(metric => {
        const flowName = metric.metadata.flow;
        if (!flowsByName[flowName]) {
          flowsByName[flowName] = [];
        }
        flowsByName[flowName].push(metric);
      });
      
      // Analyze each flow
      Object.keys(flowsByName).forEach(flowName => {
        const flowTimes = flowsByName[flowName].map(m => m.value);
        const avgTime = flowTimes.reduce((a, b) => a + b, 0) / flowTimes.length;
        
        // Get related step metrics
        const stepMetrics = groupedMetrics.flow_step_time ? 
          groupedMetrics.flow_step_time.filter(m => m.metadata.flow === flowName) : [];
        
        const stepsByNumber = {};
        stepMetrics.forEach(metric => {
          const stepNumber = metric.metadata.stepNumber;
          if (!stepsByNumber[stepNumber]) {
            stepsByNumber[stepNumber] = [];
          }
          stepsByNumber[stepNumber].push(metric);
        });
        
        console.log(chalk.cyan(`\nFlow: ${flowName}`));
        console.log(`  Average completion time: ${avgTime.toFixed(2)}ms`);
        console.log(`  Total executions: ${flowTimes.length}`);
        
        // Step breakdown
        if (Object.keys(stepsByNumber).length > 0) {
          console.log('  Step breakdown:');
          
          Object.keys(stepsByNumber).sort((a, b) => Number(a) - Number(b)).forEach(stepNumber => {
            const stepTimes = stepsByNumber[stepNumber].map(m => m.value);
            const avgStepTime = stepTimes.reduce((a, b) => a + b, 0) / stepTimes.length;
            const stepName = stepsByNumber[stepNumber][0].metadata.step;
            
            console.log(`    ${stepNumber}. ${stepName}: ${avgStepTime.toFixed(2)}ms (${(avgStepTime / avgTime * 100).toFixed(1)}% of total)`);
          });
        }
      });
    }
    
    console.log(chalk.green('\n✅ Advanced performance analysis complete'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error analyzing advanced performance results:'), error);
  }
}

// Execute
runAdvancedTests();