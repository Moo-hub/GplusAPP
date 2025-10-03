const mocha = require('mocha');
const fs = require('fs');
const path = require('path');
const { EVENT_RUN_BEGIN, EVENT_RUN_END, EVENT_TEST_FAIL, EVENT_TEST_PASS, EVENT_SUITE_BEGIN, EVENT_SUITE_END, EVENT_TEST_PENDING } = mocha.Runner.constants;

/**
 * Dashboard Reporter for Cypress tests
 * Generates JSON data for test metrics tracking over time
 */
class GplusDashboardReporter {
  constructor(runner, options) {
    this.stats = {
      suites: 0,
      tests: 0,
      passes: 0,
      failures: 0,
      skipped: 0,
      duration: 0,
      startTime: new Date(),
      endTime: null
    };
    
    this.testCategories = {
      'authentication': { total: 0, passed: 0, failed: 0, skipped: 0 },
      'pickup-workflow': { total: 0, passed: 0, failed: 0, skipped: 0 },
      'mobile-responsiveness': { total: 0, passed: 0, failed: 0, skipped: 0 },
      'performance': { total: 0, passed: 0, failed: 0, skipped: 0 },
      'accessibility': { total: 0, passed: 0, failed: 0, skipped: 0 },
      'others': { total: 0, passed: 0, failed: 0, skipped: 0 }
    };
    
    this.testResults = [];
    this.options = options || {};
    this.reportDir = path.resolve(this.options.reporterOptions?.reportDir || 'cypress/dashboard');
    this.reportFilename = this.options.reporterOptions?.reportFilename || 'metrics.json';
    this.historyFilename = 'history.json';
    
    // Ensure report directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
    
    runner.on(EVENT_RUN_BEGIN, () => {
      this.stats.startTime = new Date();
    });
    
    runner.on(EVENT_SUITE_BEGIN, (suite) => {
      if (suite.root) return;
      this.stats.suites++;
    });
    
    runner.on(EVENT_TEST_PASS, (test) => {
      this.stats.passes++;
      this.stats.tests++;
      this.stats.duration += test.duration;
      
      const category = this.getCategoryFromTest(test);
      this.testCategories[category].total++;
      this.testCategories[category].passed++;
      
      this.testResults.push({
        title: test.title,
        fullTitle: test.fullTitle(),
        file: test.file,
        duration: test.duration,
        state: 'passed',
        category: category,
        timestamp: new Date().toISOString()
      });
    });
    
    runner.on(EVENT_TEST_FAIL, (test, err) => {
      this.stats.failures++;
      this.stats.tests++;
      this.stats.duration += test.duration;
      
      const category = this.getCategoryFromTest(test);
      this.testCategories[category].total++;
      this.testCategories[category].failed++;
      
      this.testResults.push({
        title: test.title,
        fullTitle: test.fullTitle(),
        file: test.file,
        duration: test.duration,
        state: 'failed',
        category: category,
        error: {
          message: err.message,
          stack: err.stack
        },
        timestamp: new Date().toISOString()
      });
    });
    
    runner.on(EVENT_TEST_PENDING, (test) => {
      this.stats.skipped++;
      this.stats.tests++;
      
      const category = this.getCategoryFromTest(test);
      this.testCategories[category].total++;
      this.testCategories[category].skipped++;
      
      this.testResults.push({
        title: test.title,
        fullTitle: test.fullTitle(),
        file: test.file,
        state: 'skipped',
        category: category,
        timestamp: new Date().toISOString()
      });
    });
    
    runner.on(EVENT_RUN_END, () => {
      this.stats.endTime = new Date();
      this.generateReport();
    });
  }
  
  getCategoryFromTest(test) {
    const filePath = test.file || '';
    const fileName = path.basename(filePath).toLowerCase();
    
    if (fileName.includes('authentication')) return 'authentication';
    if (fileName.includes('pickup')) return 'pickup-workflow';
    if (fileName.includes('mobile') || fileName.includes('responsive')) return 'mobile-responsiveness';
    if (fileName.includes('performance')) return 'performance';
    if (fileName.includes('accessibility') || fileName.includes('a11y')) return 'accessibility';
    
    return 'others';
  }
  
  generateReport() {
    // Create current run metrics
    const runData = {
      timestamp: new Date().toISOString(),
      buildId: process.env.CI_BUILD_ID || `local-${Date.now()}`,
      branch: process.env.CI_BRANCH || 'local',
      duration: this.stats.endTime - this.stats.startTime,
      stats: {
        ...this.stats,
        passPercent: this.stats.tests > 0 ? Math.round((this.stats.passes / this.stats.tests) * 100) : 0
      },
      categories: this.testCategories,
      results: this.testResults
    };
    
    // Write current run data
    const reportPath = path.join(this.reportDir, this.reportFilename);
    fs.writeFileSync(reportPath, JSON.stringify(runData, null, 2));
    
    // Update history data
    this.updateHistory(runData);
    
    // Generate dashboard index.html if it doesn't exist
    this.ensureDashboardHtml();
    
    console.log(`\nDashboard metrics generated at: ${this.reportDir}\n`);
  }
  
  updateHistory(runData) {
    const historyPath = path.join(this.reportDir, this.historyFilename);
    let history = [];
    
    // Read existing history if available
    if (fs.existsSync(historyPath)) {
      try {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      } catch (e) {
        console.error('Error reading history file:', e);
      }
    }
    
    // Create summary for history (exclude detailed test results)
    const historySummary = {
      timestamp: runData.timestamp,
      buildId: runData.buildId,
      branch: runData.branch,
      duration: runData.duration,
      stats: runData.stats,
      categories: runData.categories
    };
    
    // Add current run to history
    history.push(historySummary);
    
    // Keep only last 100 runs to prevent file size growth
    if (history.length > 100) {
      history = history.slice(-100);
    }
    
    // Write updated history
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }
  
  ensureDashboardHtml() {
    const indexPath = path.join(this.reportDir, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>G+ App Test Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <style>
        :root {
            --color-pass: #4caf50;
            --color-fail: #f44336;
            --color-skip: #ff9800;
            --color-bg: #f5f7f9;
            --color-text: #333;
            --color-border: #ddd;
            --color-header: #2196F3;
            --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        body {
            font-family: var(--font-family);
            line-height: 1.6;
            color: var(--color-text);
            background: var(--color-bg);
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        h1 {
            color: var(--color-header);
            margin: 0;
            font-size: 28px;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .chart-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        
        .chart-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: var(--color-header);
        }
        
        .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .stat-box {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 15px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
        }
        
        .stat-label {
            font-size: 14px;
            color: #777;
        }
        
        .positive {
            color: var(--color-pass);
        }
        
        .negative {
            color: var(--color-fail);
        }
        
        .table-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: #f5f5f5;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid var(--color-border);
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid var(--color-border);
        }
        
        tr:hover {
            background: #f9f9f9;
        }
        
        .passed {
            color: var(--color-pass);
            font-weight: bold;
        }
        
        .failed {
            color: var(--color-fail);
            font-weight: bold;
        }
        
        .skipped {
            color: var(--color-skip);
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>G+ App Test Dashboard</h1>
            <p>Test metrics and history visualization</p>
        </header>
        
        <div class="stats-container" id="latestStats">
            <!-- Latest stats will be inserted here -->
        </div>
        
        <div class="dashboard-grid">
            <div class="chart-container">
                <div class="chart-title">Pass Rate Trend</div>
                <canvas id="passRateChart"></canvas>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">Test Count by Category</div>
                <canvas id="categoryChart"></canvas>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">Test Duration Trend</div>
                <canvas id="durationChart"></canvas>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">Test Results Distribution</div>
                <canvas id="resultsDistributionChart"></canvas>
            </div>
        </div>
        
        <div class="table-container">
            <h2>Recent Test Runs</h2>
            <table id="historyTable">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Build</th>
                        <th>Pass Rate</th>
                        <th>Tests</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Skipped</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- History data will be inserted here -->
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        // Load history data
        async function loadData() {
            try {
                const historyResponse = await fetch('./history.json');
                const historyData = await historyResponse.json();
                
                const metricsResponse = await fetch('./metrics.json');
                const currentRun = await metricsResponse.json();
                
                renderDashboard(historyData, currentRun);
            } catch (error) {
                console.error('Error loading data:', error);
                document.body.innerHTML = '<div class="container"><h1>Error Loading Dashboard Data</h1><p>Please check that history.json and metrics.json exist in the dashboard folder.</p></div>';
            }
        }
        
        function formatDuration(ms) {
            if (ms < 1000) return \`\${ms}ms\`;
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            if (minutes === 0) return \`\${seconds}s\`;
            return \`\${minutes}m \${remainingSeconds}s\`;
        }
        
        function renderDashboard(historyData, currentRun) {
            // Render latest stats
            renderLatestStats(currentRun);
            
            // Render charts
            renderPassRateChart(historyData);
            renderCategoryChart(currentRun);
            renderDurationChart(historyData);
            renderResultsDistributionChart(historyData);
            
            // Render history table
            renderHistoryTable(historyData);
        }
        
        function renderLatestStats(currentRun) {
            const statsContainer = document.getElementById('latestStats');
            
            const stats = [
                { label: 'Last Run', value: new Date(currentRun.timestamp).toLocaleString() },
                { label: 'Pass Rate', value: \`\${currentRun.stats.passPercent}%\`, class: currentRun.stats.passPercent > 90 ? 'positive' : 'negative' },
                { label: 'Total Tests', value: currentRun.stats.tests },
                { label: 'Total Duration', value: formatDuration(currentRun.duration) }
            ];
            
            statsContainer.innerHTML = stats.map(stat => \`
                <div class="stat-box">
                    <div class="stat-value \${stat.class || ''}">\${stat.value}</div>
                    <div class="stat-label">\${stat.label}</div>
                </div>
            \`).join('');
        }
        
        function renderPassRateChart(historyData) {
            const ctx = document.getElementById('passRateChart').getContext('2d');
            
            // Get last 20 entries
            const recentData = historyData.slice(-20);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: recentData.map(run => {
                        const date = new Date(run.timestamp);
                        return date.toLocaleDateString();
                    }),
                    datasets: [{
                        label: 'Pass Rate %',
                        data: recentData.map(run => run.stats.passPercent),
                        fill: false,
                        borderColor: '#4caf50',
                        tension: 0.1,
                        borderWidth: 2
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: Math.max(0, Math.min(...recentData.map(run => run.stats.passPercent)) - 10),
                            max: 100,
                            title: {
                                display: true,
                                text: 'Pass Rate %'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                afterLabel: function(context) {
                                    const index = context.dataIndex;
                                    const data = context.chart.data.datasets[0].data[index];
                                    const run = recentData[index];
                                    return [
                                        \`Tests: \${run.stats.tests}\`,
                                        \`Passed: \${run.stats.passes}\`,
                                        \`Failed: \${run.stats.failures}\`,
                                        \`Build: \${run.buildId}\`
                                    ];
                                }
                            }
                        }
                    }
                }
            });
        }
        
        function renderCategoryChart(currentRun) {
            const ctx = document.getElementById('categoryChart').getContext('2d');
            
            const categories = Object.keys(currentRun.categories);
            const passedData = categories.map(cat => currentRun.categories[cat].passed);
            const failedData = categories.map(cat => currentRun.categories[cat].failed);
            const skippedData = categories.map(cat => currentRun.categories[cat].skipped);
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: categories.map(cat => cat.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())),
                    datasets: [
                        {
                            label: 'Passed',
                            data: passedData,
                            backgroundColor: '#4caf50',
                        },
                        {
                            label: 'Failed',
                            data: failedData,
                            backgroundColor: '#f44336',
                        },
                        {
                            label: 'Skipped',
                            data: skippedData,
                            backgroundColor: '#ff9800',
                        }
                    ]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            stacked: true,
                            title: {
                                display: true,
                                text: 'Number of Tests'
                            }
                        },
                        x: {
                            stacked: true,
                            title: {
                                display: true,
                                text: 'Test Categories'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                afterTitle: function(context) {
                                    const index = context[0].dataIndex;
                                    const catKey = categories[index];
                                    const catData = currentRun.categories[catKey];
                                    return \`Total: \${catData.total} tests\`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        function renderDurationChart(historyData) {
            const ctx = document.getElementById('durationChart').getContext('2d');
            
            // Get last 20 entries
            const recentData = historyData.slice(-20);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: recentData.map(run => {
                        const date = new Date(run.timestamp);
                        return date.toLocaleDateString();
                    }),
                    datasets: [{
                        label: 'Duration (seconds)',
                        data: recentData.map(run => run.duration / 1000),
                        fill: false,
                        borderColor: '#2196F3',
                        tension: 0.1,
                        borderWidth: 2
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Duration (seconds)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        }
                    }
                }
            });
        }
        
        function renderResultsDistributionChart(historyData) {
            const ctx = document.getElementById('resultsDistributionChart').getContext('2d');
            
            // Get latest run
            const latestRun = historyData[historyData.length - 1];
            
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Passed', 'Failed', 'Skipped'],
                    datasets: [{
                        data: [
                            latestRun.stats.passes,
                            latestRun.stats.failures,
                            latestRun.stats.skipped
                        ],
                        backgroundColor: [
                            '#4caf50',
                            '#f44336',
                            '#ff9800'
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label;
                                    const value = context.raw;
                                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return \`\${label}: \${value} (\${percentage}%)\`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        function renderHistoryTable(historyData) {
            const tableBody = document.querySelector('#historyTable tbody');
            
            // Get last 10 entries in reverse chronological order
            const recentData = historyData.slice(-10).reverse();
            
            tableBody.innerHTML = recentData.map(run => {
                const date = new Date(run.timestamp);
                
                return \`
                    <tr>
                        <td>\${date.toLocaleString()}</td>
                        <td>\${run.buildId}</td>
                        <td class="\${run.stats.passPercent > 90 ? 'passed' : 'failed'}">\${run.stats.passPercent}%</td>
                        <td>\${run.stats.tests}</td>
                        <td>\${run.stats.passes}</td>
                        <td>\${run.stats.failures}</td>
                        <td>\${run.stats.skipped}</td>
                        <td>\${formatDuration(run.duration)}</td>
                    </tr>
                \`;
            }).join('');
        }
        
        // Load data when page loads
        window.addEventListener('DOMContentLoaded', loadData);
    </script>
</body>
</html>
      `;
      
      fs.writeFileSync(indexPath, html);
    }
  }
}

module.exports = GplusDashboardReporter;