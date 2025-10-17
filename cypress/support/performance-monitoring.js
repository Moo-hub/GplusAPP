/**
 * Cypress task to track test performance metrics
 * Extends the Cypress plugins to track and store performance data
 */

const fs = require('fs');
const path = require('path');

/**
 * Configures performance monitoring for Cypress tests
 * @param {Object} on - Cypress 'on' function for registering events
 * @param {Object} config - Cypress configuration
 */
function setupPerformanceMonitoring(on, config) {
  // Define directories for storing performance data
  const performanceDir = path.join(__dirname, '../../cypress/performance');
  const dataFile = path.join(performanceDir, 'metrics.json');
  
  // Ensure the performance directory exists
  if (!fs.existsSync(performanceDir)) {
    fs.mkdirSync(performanceDir, { recursive: true });
  }
  
  // Initialize or load existing metrics
  let performanceMetrics = [];
  if (fs.existsSync(dataFile)) {
    try {
      performanceMetrics = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (e) {
      console.error('Error loading performance metrics file:', e);
    }
  }
  
  // Register task for recording metrics
  on('task', {
    // Record a performance metric
    recordMetric({ name, value, unit, test = null, metadata = {} }) {
      const testInfo = test || (Cypress && Cypress.currentTest ? {
        title: Cypress.currentTest.title,
        fullTitle: Cypress.currentTest.fullTitle
      } : null);
      
      const metric = {
        name,
        value: parseFloat(value),
        unit: unit || 'ms',
        timestamp: new Date().toISOString(),
        test: testInfo,
        metadata: metadata,
        browser: config.browser?.name || 'unknown',
        viewport: `${config.viewportWidth}x${config.viewportHeight}`
      };
      
      performanceMetrics.push(metric);
      
      // Periodically save metrics (not on every call to avoid disk I/O)
      if (performanceMetrics.length % 10 === 0 || 
          name === 'testEnd' || 
          name.startsWith('page_') || 
          metadata.isCritical) {
        fs.writeFileSync(dataFile, JSON.stringify(performanceMetrics, null, 2));
      }
      
      return null;
    },
    
    // Generate performance report
    generatePerformanceReport() {
      // Get metrics from the last run (last 100 metrics)
      const recentMetrics = performanceMetrics.slice(-100);
      
      // Group by metric name
      const groupedMetrics = {};
      recentMetrics.forEach(metric => {
        if (!groupedMetrics[metric.name]) {
          groupedMetrics[metric.name] = [];
        }
        groupedMetrics[metric.name].push(metric);
      });
      
      // Calculate statistics for each metric group
      const stats = {};
      Object.keys(groupedMetrics).forEach(name => {
        const values = groupedMetrics[name].map(m => m.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const p95 = calculatePercentile(values, 95);
        
        stats[name] = {
          count: values.length,
          avg,
          min,
          max,
          p95,
          unit: groupedMetrics[name][0].unit
        };
      });
      
      // Generate report
      const report = {
        timestamp: new Date().toISOString(),
        metrics: stats,
        browser: config.browser?.name || 'unknown',
        viewport: `${config.viewportWidth}x${config.viewportHeight}`
      };
      
      // Save report
      const reportFile = path.join(performanceDir, `report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      return report;
    }
  });
  
  // Record test start/end for tracking test execution performance
  on('before:spec', (spec) => {
    on('task', {
      recordTestStart({ testName }) {
        return {
          name: 'testStart',
          value: 0,
          test: { title: testName },
          metadata: { spec: spec.name }
        };
      }
    });
  });
  
  on('after:spec', (spec, results) => {
    // Record test duration
    if (results && results.stats) {
      on('task', {
        recordMetric({
          name: 'testDuration',
          value: results.stats.duration,
          unit: 'ms',
          metadata: {
            spec: spec.name,
            tests: results.stats.tests,
            passes: results.stats.passes,
            failures: results.stats.failures,
            skipped: results.stats.pending
          }
        })
      });
    }
  });
  
  // Generate HTML report after run
  on('after:run', () => {
    generateHtmlReport(performanceDir, performanceMetrics);
  });
}

/**
 * Calculate percentile for a sorted array of numbers
 * @param {Array} values - Array of numeric values
 * @param {Number} percentile - Percentile to calculate (0-100)
 * @returns {Number} The calculated percentile value
 */
function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;
  
  // Sort values in ascending order
  const sorted = [...values].sort((a, b) => a - b);
  
  // Calculate the index
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Generate HTML report from performance metrics
 * @param {String} dir - Directory where report will be saved
 * @param {Array} metrics - Array of performance metrics
 */
function generateHtmlReport(dir, metrics) {
  // Group metrics by type
  const groupedMetrics = {};
  metrics.forEach(metric => {
    const type = metric.name.includes('_') ? metric.name.split('_')[0] : 'other';
    if (!groupedMetrics[type]) {
      groupedMetrics[type] = [];
    }
    groupedMetrics[type].push(metric);
  });
  
  // Create HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>G+ App Performance Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9f9f9;
    }
    h1, h2, h3 {
      color: #2196F3;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    .chart-container {
      height: 400px;
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .metric-group {
      margin-bottom: 40px;
    }
  </style>
</head>
<body>
  <header class="container">
    <h1>G+ App Performance Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </header>

  <div class="container">
    <h2>Performance Overview</h2>
    <div class="chart-container">
      <canvas id="overviewChart"></canvas>
    </div>
  </div>

  ${Object.keys(groupedMetrics).map(type => `
  <div class="container metric-group">
    <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Metrics</h2>
    <div class="chart-container">
      <canvas id="${type}Chart"></canvas>
    </div>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Average</th>
          <th>Min</th>
          <th>Max</th>
          <th>P95</th>
          <th>Unit</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        ${groupedMetrics[type].map(metric => {
          const values = groupedMetrics[type]
            .filter(m => m.name === metric.name)
            .map(m => m.value);
            
          const sum = values.reduce((a, b) => a + b, 0);
          const avg = sum / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          const p95 = calculatePercentile(values, 95);
          
          return `
          <tr>
            <td>${metric.name}</td>
            <td>${avg.toFixed(2)}</td>
            <td>${min.toFixed(2)}</td>
            <td>${max.toFixed(2)}</td>
            <td>${p95.toFixed(2)}</td>
            <td>${metric.unit}</td>
            <td>${values.length}</td>
          </tr>
          `;
        }).filter((value, index, self) => {
          // Remove duplicate rows by checking metric name
          const metricNames = self.map(row => row.split('<td>')[1].split('</td>')[0]);
          return metricNames.indexOf(metricNames[index]) === index;
        }).join('')}
      </tbody>
    </table>
  </div>
  `).join('')}

  <script>
    // Process metric data for charts
    const metricData = ${JSON.stringify(groupedMetrics)};
    
    // Overview chart
    const overviewCtx = document.getElementById('overviewChart').getContext('2d');
    const overviewData = {};
    
    Object.keys(metricData).forEach(type => {
      const metrics = metricData[type];
      metrics.forEach(metric => {
        if (!overviewData[metric.name]) {
          overviewData[metric.name] = {
            values: [],
            timestamps: []
          };
        }
        overviewData[metric.name].values.push(metric.value);
        overviewData[metric.name].timestamps.push(new Date(metric.timestamp).toLocaleString());
      });
    });
    
    // Take top 5 metrics by average value
    const topMetrics = Object.keys(overviewData)
      .map(name => {
        const sum = overviewData[name].values.reduce((a, b) => a + b, 0);
        return {
          name,
          avg: sum / overviewData[name].values.length
        };
      })
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
    
    new Chart(overviewCtx, {
      type: 'bar',
      data: {
        labels: topMetrics.map(m => m.name),
        datasets: [{
          label: 'Average (ms)',
          data: topMetrics.map(m => m.avg),
          backgroundColor: 'rgba(33, 150, 243, 0.7)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Average (ms)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Top 5 Metrics by Average Value'
          }
        }
      }
    });
    
    // Individual type charts
    Object.keys(metricData).forEach(type => {
      const metrics = metricData[type];
      const uniqueNames = [...new Set(metrics.map(m => m.name))];
      
      // Skip if no metrics or canvas doesn't exist
      if (uniqueNames.length === 0 || !document.getElementById(type + 'Chart')) return;
      
      const ctx = document.getElementById(type + 'Chart').getContext('2d');
      
      // Group by name and calculate averages
      const data = uniqueNames.map(name => {
        const values = metrics.filter(m => m.name === name).map(m => m.value);
        const sum = values.reduce((a, b) => a + b, 0);
        return {
          name,
          avg: sum / values.length
        };
      });
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.name),
          datasets: [{
            label: 'Average (ms)',
            data: data.map(d => d.avg),
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Average (ms)'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: \`\${type.charAt(0).toUpperCase() + type.slice(1)} Metrics\`
            }
          }
        }
      });
    });
  </script>
</body>
</html>
  `;
  
  // Write HTML report
  const reportPath = path.join(dir, 'performance-report.html');
  fs.writeFileSync(reportPath, html);
  
  console.log(`Performance report generated at: ${reportPath}`);
}

module.exports = {
  setupPerformanceMonitoring
};